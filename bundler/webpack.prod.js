const { merge } = require("webpack-merge");
const commonConfiguration = require("./webpack.common.js");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = merge(commonConfiguration, {
  mode: "production",
  devtool: false,
  plugins: [
    new CleanWebpackPlugin(),
    // Gzip compression for assets
    new CompressionPlugin({
      filename: "[path][base].gz",
      algorithm: "gzip",
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    // Brotli compression for assets (better compression than gzip)
    new CompressionPlugin({
      filename: "[path][base].br",
      algorithm: "brotliCompress",
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ["console.log", "console.info", "console.debug"],
          },
          mangle: true,
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
    splitChunks: {
      chunks: "all",
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        // Three.js vendor chunk
        three: {
          test: /[\\/]node_modules[\\/]three[\\/]/,
          name: "vendor-three",
          chunks: "all",
          priority: 20,
        },
        // GSAP vendor chunk
        gsap: {
          test: /[\\/]node_modules[\\/]gsap[\\/]/,
          name: "vendor-gsap",
          chunks: "all",
          priority: 15,
        },
        // Other vendors
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
          priority: 10,
        },
        // Common chunks shared between entry points
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: "single",
  },
  performance: {
    hints: "warning",
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
});
