/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF5C00',
        },
        app: {
          bg: '#FFFFFF',
          surface: '#000000',
        },
      },
      fontFamily: {
        noto: ['NotoSerifKR_400Regular'],
        'noto-semibold': ['NotoSerifKR_600SemiBold'],
        'noto-bold': ['NotoSerifKR_700Bold'],
        'noto-extrabold': ['NotoSerifKR_800ExtraBold'],
        'wanted-regular': ['WantedSans-Regular'],
        'wanted-semibold': ['WantedSans-SemiBold'],
        'wanted-bold': ['WantedSans-Bold'],
      },
    },
  },
  plugins: [],
};
