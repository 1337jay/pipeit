import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    turbopack: {
        resolveAlias: {
            // Alias .js imports to .ts files for monorepo packages
        },
        resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
};

export default nextConfig;
