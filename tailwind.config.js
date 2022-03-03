module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        gray: {
          300: '#9A9A9A',
          400: '#888293',
          500: '#29262F',
          600: '#0C0C0C',
          900: '#060706',
        },
        background: 'rgb(11,11,11)',
        black: 'rgb(0,0,0)',
        white: '#E9E9E9',
        offWhite: '#c4c4c4',
      },
    },
  },
};
