/** @type {import('next').NextConfig} */
const apiBase = process.env.API_BASE_URL ?? "http://localhost:3000";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiBase}/api/:path*` },
    ];
  },
};

export default nextConfig;
