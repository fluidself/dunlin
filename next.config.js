/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BASE_URL: 'http://localhost:3000', // TODO: ternary to deployed url when deployed
  },
};

module.exports = nextConfig;
