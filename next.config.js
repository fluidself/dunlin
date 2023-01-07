const withPWA = require('next-pwa')({
  dest: 'public',
  scope: '/',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: false,
  register: false,
  skipWaiting: false,
});

module.exports = withPWA({
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/app/:deckId/note',
        destination: '/app/:deckId',
        permanent: false,
      },
      {
        source: '/app',
        destination: '/',
        permanent: false,
      },
      {
        source: '/publications',
        destination: '/',
        permanent: false,
      },
    ];
  },
  env: {
    BASE_URL: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://dunlin.xyz',
  },
});
