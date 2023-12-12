const path = require('path');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const fs = require('node:fs');

class MakeExecutable {
  constructor(options = { fileList: [] }) {
    this.options = { ...options };
  }
  apply(compiler) {
    compiler.hooks.done.tapPromise(
      'MakeExecutable',
      () =>
        new Promise((resolve) => {
          this.options.fileList.forEach((filepath) => {
            if (fs.existsSync(filepath)) {
              fs.chmodSync(filepath, '755');
            }
          });
          resolve();
        }),
    );
  }
}

module.exports = {
  devtool: false,
  entry: './src/index',
  target: 'node',
  externals: [nodeExternals()],
  plugins: [
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }),
    new MakeExecutable({
      fileList: [`${__dirname}/dist/app.js`],
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        use: 'babel-loader',
      },
    ],
  },
};
