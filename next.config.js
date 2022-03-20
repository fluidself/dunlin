const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

module.exports = phase => {
  return {
    reactStrictMode: true,
    async redirects() {
      return [
        {
          source: '/app',
          destination: '/',
          permanent: true,
        },
      ];
    },
    env: {
      BASE_URL: phase === PHASE_DEVELOPMENT_SERVER ? 'http://localhost:3000' : 'https://deck-tau.vercel.app',
    },
  };
};
