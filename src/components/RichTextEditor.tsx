"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef } from "react";
import { uploadImage } from "@/lib/upload";

export default function RichTextEditor({
  noteId,
  initialContent,
  onUpdate,
}: {
  noteId: string;
  initialContent: string;
  onUpdate: (html: string) => void;
}) {
  // Keep latest noteId for the async upload handlers below.
  const noteIdRef = useRef(noteId);
  noteIdRef.current = noteId;

  const handleUpdate = useCallback(
    (html: string) => {
      onUpdate(html);
    },
    [onUpdate]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // We render our own placeholder via the Placeholder extension.
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder: "Write task details, paste screenshots, or drag images here…",
      }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[60vh] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      handleUpdate(editor.getHTML());
    },
  });

  // Whenever the selected note changes, swap the editor's content.
  useEffect(() => {
    if (!editor) return;
    // Avoid creating an undo entry when switching notes.
    const current = editor.getHTML();
    if (current !== initialContent) {
      editor.commands.setContent(initialContent || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, initialContent, editor]);

  // --- Image upload via upload button ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertFiles = useCallback(
    async (files: FileList | File[]) => {
      const ed = editor;
      if (!ed) return;
      const list = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      for (const file of list) {
        const url = await uploadImage(noteIdRef.current, file);
        if (url) {
          ed.chain().focus().setImage({ src: url }).run();
        }
      }
    },
    [editor]
  );

  // --- Paste & drop images ---
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const images: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) images.push(f);
        }
      }
      if (images.length > 0) {
        e.preventDefault();
        void insertFiles(images);
      }
    };

    const onDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const hasImage = Array.from(files).some((f) =>
        f.type.startsWith("image/")
      );
      if (!hasImage) return;
      e.preventDefault();
      void insertFiles(files);
    };

    dom.addEventListener("paste", onPaste);
    dom.addEventListener("drop", onDrop);
    return () => {
      dom.removeEventListener("paste", onPaste);
      dom.removeEventListener("drop", onDrop);
    };
  }, [editor, insertFiles]);

  if (!editor) {
    return (
      <div className="min-h-[60vh] px-4 py-3 text-slate-400">Loading editor…</div>
    );
  }

  return (
    <div className="border-t border-slate-200">
      <Toolbar
        editor={editor}
        onInsertImage={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            void insertFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor,
  onInsertImage,
}: {
  editor: ReturnType<typeof useEditor>;
  onInsertImage: () => void;
}) {
  if (!editor) return null;
  const Btn = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-1 rounded text-sm border ${
        active
          ? "bg-brand-100 border-brand-300 text-brand-800"
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200">
      <Btn title="Bold (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
        <span className="font-bold">B</span>
      </Btn>
      <Btn title="Italic (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
        <span className="italic">I</span>
      </Btn>
      <Btn title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
        <span className="line-through">S</span>
      </Btn>
      <span className="w-px h-5 bg-slate-200 mx-1" />
      <Btn title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}>
        H1
      </Btn>
      <Btn title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
        H2
      </Btn>
      <Btn title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
        H3
      </Btn>
      <span className="w-px h-5 bg-slate-200 mx-1" />
      <Btn title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
        • List
      </Btn>
      <Btn title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
        1. List
      </Btn>
      <Btn title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
        ❝
      </Btn>
      <Btn title="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}>
        {"</>"}
      </Btn>
      <span className="w-px h-5 bg-slate-200 mx-1" />
      <Btn title="Insert image (paste, drop, or upload)" onClick={onInsertImage}>
        🖼 Image
      </Btn>
      <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </Btn>
      <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </Btn>
    </div>
  );
}
