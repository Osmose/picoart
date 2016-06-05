var path = require('path');

var defaults = {
  devtool: 'source-map',
  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __filename: false,
    __dirname: false,
    setImmediate: true
  },
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
      {test: /\.json$/, loader: 'json-loader'}
    ]
  }
};

module.exports = [
  Object.assign({}, defaults, {
    entry: './src/main/index.js',
    output: {
      path: path.resolve(__dirname, 'src'),
      filename: 'main.built.js'
    },
    target: 'electron'
  }),
  Object.assign({}, defaults, {
    entry: ['babel-polyfill', './src/renderer/index.js'],
    output: {
      path: path.resolve(__dirname, 'src'),
      filename: 'renderer.built.js'
    },
    target: 'electron-renderer'
  })
];
