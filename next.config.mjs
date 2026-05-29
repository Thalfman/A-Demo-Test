/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static, client-only export — deployable to Vercel as a static site.
  // Build emits the site to ./out (no server, no API routes).
  output: 'export',
  // next/image optimization requires a server; disable for static export.
  images: { unoptimized: true },
  // Emit /route/index.html so static hosts resolve clean URLs.
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
