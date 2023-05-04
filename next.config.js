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
  webpack(config) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
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
    SUPABASE_URL:
      process.env.NODE_ENV === 'development'
        ? process.env.NEXT_PUBLIC_SUPABASE_URL_ALT
        : process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_KEY:
      process.env.NODE_ENV === 'development'
        ? process.env.NEXT_PUBLIC_SUPABASE_KEY_ALT
        : process.env.NEXT_PUBLIC_SUPABASE_KEY,
    WEBSOCKET_ENDPOINT:
      process.env.NODE_ENV === 'development' ? 'ws://localhost:1234' : process.env.NEXT_PUBLIC_Y_WEBSOCKET_ENDPOINT,
  },
});
