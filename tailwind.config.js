/* eslint-disable @typescript-eslint/no-var-requires */
const { fontFamily } = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1280px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
        heading: ['Cal Sans', 'Inter', ...fontFamily.sans],
      },
      spacing: {
        0.25: '0.0625rem',
        128: '32rem',
        160: '40rem',
        176: '44rem',
        192: '48rem',
        240: '60rem',
        'screen-10': '10vh',
        'screen-80': '80vh',
      },
      colors: {
        primary: colors.fuchsia,
        gray: colors.neutral,
      },
      boxShadow: {
        popover: 'rgb(15 15 15 / 10%) 0px 3px 6px, rgb(15 15 15 / 20%) 0px 9px 24px',
      },
      opacity: {
        0.1: '0.001',
        85: '.85',
      },
      zIndex: {
        '-10': '-10',
      },
      cursor: {
        alias: 'alias',
      },
      typography: {
        DEFAULT: {
          css: {
            b: {
              fontWeight: 600,
            },
            h1: {
              fontWeight: 400,
            },
            h2: {
              fontWeight: 400,
            },
            h3: {
              fontWeight: 400,
            },
            h4: {
              fontWeight: 400,
            },
            h5: {
              fontWeight: 600,
            },
            h6: {
              fontWeight: 600,
            },
            a: {
              textDecoration: 'none',
              fontWeight: 'normal',
              '&:hover': {
                color: colors.fuchsia[300],
              },
            },
            'input[type="checkbox"]': {
              color: colors.fuchsia[500],
            },
            'details > p': {
              marginTop: '10px',
              marginLeft: '22px',
            },
            mark: {
              color: colors.neutral[100],
              backgroundColor: '#828324',
            },
            pre: {
              color: colors.neutral[100],
              backgroundColor: colors.neutral[800],
            },
            'pre code::before': {
              'padding-left': 'unset',
            },
            'pre code::after': {
              'padding-right': 'unset',
              backgroundColor: colors.neutral[800],
            },
            code: {
              color: colors.neutral[100],
              backgroundColor: colors.neutral[800],
              fontWeight: '400',
              fontSize: '1em',
              padding: '0.10rem',
              borderRadius: '0.25rem',
            },
            'code::before': {
              content: '""',
              'padding-left': '0.25rem',
            },
            'code::after': {
              content: '""',
              'padding-right': '0.25rem',
            },
            '--tw-prose-invert-bullets': colors.neutral[400],
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};
