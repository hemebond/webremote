const path = require('path');
const production = process.env.NODE_ENV === 'production';
var HtmlMinifierPlugin = require('html-minifier-webpack-plugin');

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
      },
      /*
      {
        test: /\.html$/,
        use: [
          {
            loader: 'file-loader?name=[name].html'
          },
          {
            loader: 'extract-loader'
          },
          {
            loader: 'html-loader'
          }
        ]
      }
      */
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  },
  /*
  plugins: [
    new HtmlMinifierPlugin({
      // HTMLMinifier options
    })
  ]
  */
};