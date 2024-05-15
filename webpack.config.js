const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require("webpack");
const dotenv = require("dotenv");
const env = dotenv.config().parsed || {};

const plugins = [
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, 'public', 'index.html'),
    filename: 'index.html',
    hash: true,
    favicon: path.resolve(__dirname, 'node_modules', '@clinicaltoolkits/universal-react-components/dist/assets/Logo/SVG/CTLogo_Favicon.svg')
  }),
  new webpack.EnvironmentPlugin(env),
];

module.exports = (env, options) => {
  const mode = env["mode"] || "development";
  const bProduction = mode === 'production';
  console.log(`Webpack mode: ${mode}`);
  return {
    mode: mode,
    entry: bProduction ? './src/index.ts' : './tests/index.tsx',
    output: {
      filename: 'index[contenthash].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: [
            'style-loader',
            { 
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                //modules: true // TODO: This causes the Mantine CSS modules to break, consider looking into this regarding the Mantine Spotlight styling issue and reporting it on the Discord 
              }
            },
            'postcss-loader'
          ],
        },
        {
          test: /\.png$/,
          use: [
            {
              loader: 'file-loader',
              options: {},
            }
          ]
        },
        {
          test: /\.svg$/,
          use: ['@svgr/webpack', 'url-loader'],
        },
        {
          test: /\.md$/,
          use: 'raw-loader',
        },
      ],
    },
    resolve: {
      alias: { /* TODO: Setup aliases - currently removed in favour of local paths and index use*/ },
      extensions: ['.tsx', '.ts', '.js'],
      fallback: {
        "path": require.resolve("path-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser"),
      }
    },
    plugins: plugins,
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist'),
      },
      devMiddleware: {
        publicPath: '/',
      },
      compress: true,
      port: 8080,
    },
  };
};