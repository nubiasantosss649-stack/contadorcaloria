module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind's preset already registers the Reanimated/Worklets plugin,
      // so it is disabled here to avoid running it twice.
      ['babel-preset-expo', { jsxImportSource: 'nativewind', reanimated: false, worklets: false }],
      'nativewind/babel',
    ],
  };
};
