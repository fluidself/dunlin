/* eslint-disable @typescript-eslint/no-var-requires */
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
        primary: colors.pink,
        gray: colors.neutral,
        orange: colors.orange,
        background: 'rgb(11,11,11)',
        black: 'rgb(0,0,0)',
        white: '#E9E9E9',
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
      animation: {
        'bounce-x': 'bounce-x 1s infinite',
      },
      keyframes: {
        'bounce-x': {
          '0%, 100%': {
            transform: 'translateX(0)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateX(25%)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            b: {
              fontWeight: 600,
            },
            h1: {
              fontWeight: 600,
            },
            h2: {
              fontWeight: 600,
            },
            h3: {
              fontWeight: 600,
            },
            h4: {
              fontWeight: 600,
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
                color: colors.pink[500],
              },
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
            },
            'code::before': {
              content: '""',
              'padding-left': '0.25rem',
            },
            'code::after': {
              content: '""',
              'padding-right': '0.25rem',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};
