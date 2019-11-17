const path = require('path');
const production = process.env.NODE_ENV === 'production';

module.exports = {
  mode: "production",
  devtool: production ? false : 'source-map',
  entry: './client/src/js/main.jsx',
  output: {
      path: path.resolve(__dirname, 'client/dist/assets'),
      filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  }
};
