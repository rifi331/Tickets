// Client-side helper for uploading a single image to /api/images and returning
// the URL to insert into the editor.
import type { NoteImageRef } from "@/lib/types";

export async function uploadImage(
  noteId: string,
  file: File
): Promise<string | null> {
  try {
    const res = await fetch(`/api/images?noteId=${encodeURIComponent(noteId)}`, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("Image upload failed:", res.status, data);
      alert(
        `Image upload failed: ${data?.error || res.statusText || "unknown error"}`
      );
      return null;
    }
    const data = (await res.json()) as { url: string } & NoteImageRef;
    return data.url;
  } catch (err) {
    console.error(err);
    alert("Image upload failed due to a network error.");
    return null;
  }
}
