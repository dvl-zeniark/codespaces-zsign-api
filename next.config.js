/** @type {import('next').NextConfig} */
const nextConfig = {
  // undici's source uses modern private-field syntax webpack's parser can't
  // handle; skip bundling it and let Node require() it natively instead.
  experimental: {
    serverComponentsExternalPackages: ["undici"],
  },
};

module.exports = nextConfig;
