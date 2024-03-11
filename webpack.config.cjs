import CopyWebpackPlugin from 'copy-webpack-plugin'
import path from 'path'
import slsw from 'serverless-webpack'

module.exports = {
  entry: slsw.lib.entries,
  externals: {},
  target: 'node',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: 'package.json', to: 'package.json' }],
    }),
  ],
}
