import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tickets — Task Notes",
  description:
    "Self-hosted, Evernote-style task notes for tracking team work and details.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
