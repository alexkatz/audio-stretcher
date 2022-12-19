/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  plugins: [],
  theme: {
    colors: {
      black: {
        DEFAULT: 'rgb(var(--black) / <alpha-value>)',
        100: '#0d0f11',
        200: '#1a1e21',
        300: '#272d31',
      },
      ivory: 'rgb(var(--ivory) / <alpha-value>)',
      transparent: 'transparent',
    },
    opacity: {
      0: '0',
      20: '0.2',
      40: '0.4',
      60: '0.6',
      80: '0.8',
      100: '1',
    },
    fontFamily: {
      sans: ['Open Sans', 'sans-serif'],
    },
    extend: {
      spacing: {
        '3/4': '75%',
      },
    },
  },
};
