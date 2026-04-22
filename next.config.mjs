import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* 1. Turbopack Configuration
     Ensures local paths resolve correctly within the new Rust-based bundler.
  */
  turbopack: {
    root: resolve(__dirname),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  /* 3. Development Origins
     Allows tunneling services like ngrok to bypass host header checks.
  */
  devIndicators: {
    appIsrStatus: true,
  },
  // Note: In newer versions, allowedDevOrigins may be moved 
  // under the 'experimental' block as well if you get a warning.
  // @ts-ignore - depending on your exact version
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "*.ngrok-free.dev",
    "*.ngrok.io",
  ],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;