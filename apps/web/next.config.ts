import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep dev HMR artifacts isolated from production builds running in parallel.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  transpilePackages: ['@versionflow/contracts', '@versionflow/shared'],
};

export default nextConfig;

