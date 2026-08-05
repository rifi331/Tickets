/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Images are streamed directly via /api/images/[id], so we don't need the
  // Next.js image optimizer for NoteImage blobs.
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
