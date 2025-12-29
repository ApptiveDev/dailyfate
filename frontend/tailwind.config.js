/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        noto: ['NotoSerifKR_400Regular'],
        'noto-semibold': ['NotoSerifKR_600SemiBold'],
        'noto-bold': ['NotoSerifKR_700Bold'],
        'noto-extrabold': ['NotoSerifKR_800ExtraBold'],
      },
    },
  },
  plugins: [],
};
