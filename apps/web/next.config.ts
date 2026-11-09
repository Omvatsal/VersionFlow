import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@versionflow/contracts', '@versionflow/shared'],
};

export default nextConfig;

