/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.gccstartup.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/admin/crm/:path*',
        destination: '/api/crm/:path*',
      },
    ]
  },
}
export default nextConfig
