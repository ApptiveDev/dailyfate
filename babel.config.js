module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@services': './src/services',
            '@stores': './src/stores',
            '@types': './src/types',
            '@constants': './src/constants',
            '@assets': './src/assets',
            '@styles': './src/styles',
            '@providers': './src/providers',
            '@schemas': './src/schemas',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
