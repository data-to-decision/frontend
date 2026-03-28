/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@d2d/ui'],
  experimental: {
    optimizePackageImports: ['@d2d/ui', 'lucide-react'],
  },
};

module.exports = nextConfig;
