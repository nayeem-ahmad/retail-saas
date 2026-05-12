/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimized for Docker
  images: {
    // Allow product/customer images from any HTTPS source (user-supplied URLs)
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
    // Serve modern formats (avif, webp) when supported
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
