import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Disabled temporarily - causes type errors until build generates route types
  // typedRoutes: true,
}

export default nextConfig
