module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'], // Expo için gerekli
      plugins: [
        [
          "module:react-native-dotenv",
          {
            moduleName: "@env",
            path: ".env",
          },
        ],
      ],
    };
  };
  