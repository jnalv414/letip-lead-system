import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Produces .next/standalone — a self-contained Node server with minimal
  // node_modules. Required for Render Node web service deployments.
  // After build, static assets must be copied manually:
  //   cp -r .next/static .next/standalone/.next/static
  //   cp -r public .next/standalone/public
  output: 'standalone',
  // Disabled temporarily - causes type errors until build generates route types
  // typedRoutes: true,
}

export default nextConfig
