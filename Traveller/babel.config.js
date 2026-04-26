module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Altri plugin necessari (es. reanimated deve essere l'ultimo)
      'react-native-reanimated/plugin',
    ],
  };
};