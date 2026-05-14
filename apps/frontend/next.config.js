/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimized for Docker
  eslint: {
    // ESLint runs in CI (next lint) — don't block Docker image builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
