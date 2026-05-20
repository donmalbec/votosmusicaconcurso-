import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'globalpizza.party' },
      { protocol: 'https', hostname: 'www.musicaw3.com' },
      { protocol: 'https', hostname: 'www.metapool.app' },
    ],
  },
};

export default nextConfig;
