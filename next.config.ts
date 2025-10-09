import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable turbopack in development to avoid build manifest issues
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Ensure proper build output
  output: 'standalone',
  // Disable devtools in production
  ...(process.env.NODE_ENV === 'production' && {
    devIndicators: {
      buildActivity: false,
      buildActivityPosition: 'bottom-right',
    },
  }),
};

export default nextConfig;
