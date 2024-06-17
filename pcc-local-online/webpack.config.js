/* eslint-env es2020 */
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const mf = require("@angular-architects/module-federation/webpack");
const path = require("path");
const share = mf.share;
const sharedLib = require('./webpack-mf-shared');
const { shareAthenaLibs } = require('@athena/platform-devkit/lib/webpack/util');

const sharedMappings = new mf.SharedMappings();
sharedMappings.register(
  path.join(__dirname, 'tsconfig.json'),
  [/* mapped paths to share */]);

module.exports = {
  output: {
    uniqueName: "PCC",
    publicPath: "auto"
  },
  optimization: {
    runtimeChunk: false
  },   
  resolve: {
    alias: {
      ...sharedMappings.getAliases(),
    }
  },
  plugins: [
    new ModuleFederationPlugin({
      
      name: "PCC",
      filename: "TaskProjectCenterConsoleModule.js",
      exposes: {
        "./PCC": './src/app/implementation/athena-app.module.ts',
      },

      shared: share({
        ...shareAthenaLibs({
          ...sharedLib.commonLibs
        }),
        ...sharedMappings.getDescriptors()
      })
        
    }),
    sharedMappings.getPlugin()
  ],
};
