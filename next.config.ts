import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    // Fix: multiple lockfiles warning
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'vqkrlbvkdelfjqqbjvlm.supabase.co' },
      { protocol: 'https', hostname: 'drive.google.com' },
    ],
  },
};

export default nextConfig;
