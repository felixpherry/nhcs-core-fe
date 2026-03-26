import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@nhcs/api', '@nhcs/types', '@nhcs/registries', '@nhcs/config'],
};

export default nextConfig;
