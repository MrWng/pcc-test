// const path = require("path");

// // postcss插件-生成各个浏览器私有css样式-适配游览器
// const addPostCssPlugins = [
//   require("autoprefixer"),
// ];

// function regexEquals(firstValue, secondValue) {
//   return firstValue + "" == secondValue + "";
// }

// module.exports = (config, options) => {
//   // config就是系统的webpack配置

//   let rules = config.module.rules;
//   let styleRules = rules.filter(rule => {
//     let test = rule.test;
//     return (
//       regexEquals(test, /\.css$/) ||
//       regexEquals(test, /\.scss$|\.sass$/) ||
//       regexEquals(test, /\.less$/) ||
//       regexEquals(test, /\.styl$/)
//     );
//   });

//   //给所有的样式规则增加postcss-loader的plugins
//   // styleRules.forEach(rule => {
//   //   let currentPostCssLoader = rule.use.find(
//   //     loader => loader.loader === "postcss-loader"
//   //   );
//   //   let getPluginsFn = currentPostCssLoader.options.plugins;
//   //   let getPluginsAddedFn = loader => {
//   //     return [ ...getPluginsFn(loader), ...addPostCssPlugins ];
//   //   };
//   //   currentPostCssLoader.options.plugins = getPluginsAddedFn;
//   // });

//   return config;
// };

// module.exports = (config, options) => {
//   console.log(options);
// config.plugins.push(new ImportHttpWebpackPlugin());
// };
// const path = require('path');
//
// const ImportHttpWebpackPlugin = require('import-http/webpack');
// module.exports = (config, options, targetOptions) => {
//   config.plugins = [
//     new ImportHttpWebpackPlugin({
//       reload: true,
//       cacheDir: path.join(__dirname, 'fixture/cache'),
//     }),
//     ...config.plugins,
//   ];
//   // config.plugins.push(
//   //   new ImportHttpWebpackPlugin({
//   //     reload: true,
//   //     cacheDir: path.join(__dirname, 'fixture/cache'),
//   //   })
//   // );
//   return config;
// };

// const ImportHttpWebpackPlugin = require('import-http/webpack');
//
// module.exports = {
//   plugins: [
//     new ImportHttpWebpackPlugin({
//       reload: true,
//       cacheDir: path.join(__dirname, 'fixture/cache'),
//     }),
//   ],
// };

// const appName = require('./package.json').name;
// module.exports = {
//   devServer: {
//     headers: {
//       'Access-Control-Allow-Origin': '*',
//     },
//   },
//   output: {
//     library: `${appName}-[name]`,
//     libraryTarget: 'umd',
//     jsonpFunction: `webpackJsonp_${appName}`,
//   },
// };

// const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;
// const webpackMerge = require('webpack-merge');
// // const { name } = require('./package');
//
// module.exports = (angularWebpackConfig, options) => {
//   // const singleSpaWebpackConfig = singleSpaAngularWebpack(angularWebpackConfig, options);
//
//   const config = {
//     output: {
//       libraryTarget: 'umd',
//     },
//     externals: {
//       // 'zone.js': 'Zone',
//     },
//   };
//   const mergedConfig = webpackMerge.smart(angularWebpackConfig, config);
//   return mergedConfig;
// };
