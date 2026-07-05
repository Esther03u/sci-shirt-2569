import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    // Fix: multiple lockfiles warning
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
