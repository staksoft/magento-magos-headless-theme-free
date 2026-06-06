/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mageos.ddev.site',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
