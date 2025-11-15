module.exports = function(api) {
  api.cache.forever();
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-export-namespace-from',
    ],
    env: {
      test: {
        plugins: [
          '@babel/plugin-transform-export-namespace-from'
        ]
      }
    }
  };
};
