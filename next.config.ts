import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '192.168.1.54',
    'localhost',
  ],
  devIndicators: false,
}

export default nextConfig
