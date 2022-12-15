/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  plugins: [],
  theme: {
    colors: {
      black: 'black',
      primary: '#8fa5b1',
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
    extend: {
      spacing: {
        '3/4': '75%',
      },
    },
  },
};
