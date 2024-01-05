import utwm from 'unplugin-tailwindcss-mangle/webpack';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    config.infrastructureLogging = {
      // Must be checked before deploying
      level: 'error',
    };

    if (!dev) {
      config.plugins.push(
        utwm({
          classGenerator: {
            classPrefix: '',
          },
        })
      );
    }

    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
