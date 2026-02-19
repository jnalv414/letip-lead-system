import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Produces .next/standalone — a self-contained Node server with minimal
  // node_modules. Required for Render Node web service deployments.
  // After build, static assets must be copied manually:
  //   cp -r .next/static .next/standalone/.next/static
  //   cp -r public .next/standalone/public
  output: 'standalone',
  // Pin the tracing root to this directory so the standalone bundle nests
  // correctly even if there are lockfiles higher in the tree (e.g. yarn.lock
  // in the user's home directory detected on the build host).
  outputFileTracingRoot: path.resolve(__dirname),
  // Disabled temporarily - causes type errors until build generates route types
  // typedRoutes: true,
}

export default nextConfig
