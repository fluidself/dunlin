const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: false,
  register: false,
});

module.exports = withPWA({
  reactStrictMode: true,
  env: {
    BASE_URL: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://usedeck.vercel.app',
  },
});
