/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,  // ← yeh add karo
  },
  typescript: {
    ignoreBuildErrors: true,   // ← yeh bhi add karo
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: 'backend' },
      { protocol: 'http', hostname: '**' },
    ],
    unoptimized: true,
  },
}

module.exports = nextConfig