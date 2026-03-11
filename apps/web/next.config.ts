import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@nhcs/api',
    '@nhcs/types',
    '@nhcs/registries',
    '@nhcs/config',
    '@nhcs/hcm-ui',
  ],
};

export default nextConfig;
