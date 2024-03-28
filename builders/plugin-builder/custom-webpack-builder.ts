import { getSystemPath, Path } from '@angular-devkit/core';
import { Configuration } from 'webpack';

import { mergeConfigs } from './webpack-config-merger';
import { tsNodeRegister } from './utils';
import { TargetOptions } from './type-definition';
import { PluginBuilderSchema } from './plugin-schema';

export const defaultWebpackConfigPath = 'webpack.config.js';

type CustomWebpackConfig =
  | Configuration
  | Promise<Configuration>
  | ((
      baseWebpackConfig: Configuration,
      buildOptions: PluginBuilderSchema,
      targetOptions: TargetOptions
    ) => Configuration)
  | ((
      baseWebpackConfig: Configuration,
      buildOptions: PluginBuilderSchema,
      targetOptions: TargetOptions
    ) => Promise<Configuration>);

export class CustomWebpackBuilder {
  static async buildWebpackConfig(
    root: Path,
    selfOption: PluginBuilderSchema,
    baseWebpackConfig: Configuration,
    buildOptions: any,
    targetOptions: TargetOptions
  ): Promise<Configuration> {
    // if (!config) {
    //   return baseWebpackConfig;
    // }

    // const resolvedConfig = {};

    // return mergeConfigs(
    //   baseWebpackConfig,
    //   resolvedConfig,
    // );
    const { pluginName, sharedLibs } = selfOption;

    if (!pluginName) {
      throw Error('Please provide pluginName!');
    }

    // Make sure we are producing a single bundle
    delete baseWebpackConfig.entry.polyfills;
    delete baseWebpackConfig.optimization.runtimeChunk;
    delete baseWebpackConfig.optimization.splitChunks;
    delete baseWebpackConfig.entry.styles;

    baseWebpackConfig.externals = require('./lib.json');

    if (sharedLibs) {
      baseWebpackConfig.externals = [baseWebpackConfig.externals];
      const sharedLibsArr = sharedLibs.split(',');
      sharedLibsArr.forEach((sharedLibName) => {
        const factoryRegexp = new RegExp(`${sharedLibName}.ngfactory$`);
        baseWebpackConfig.externals[0][sharedLibName] = sharedLibName; // define external for code
        baseWebpackConfig.externals.push((context, request, callback) => {
          if (factoryRegexp.test(request)) {
            return callback(null, sharedLibName); // define external for factory
          }
          callback();
        });
      });
    }

    const ngCompilerPluginInstance = baseWebpackConfig.plugins.find(
      (x) => x.constructor && x.constructor.name === 'AngularCompilerPlugin'
    );
    if (ngCompilerPluginInstance) {
      ngCompilerPluginInstance._entryModule = selfOption.modulePath;
    }

    // preserve path to entry point
    // so that we can clear use it within `run` method to clear that file
    // baseWebpackConfig.entry.main[0];
    baseWebpackConfig.output.filename = `${pluginName}.js`;
    baseWebpackConfig.output.library = pluginName;
    baseWebpackConfig.output.libraryTarget = 'umd';
    // workaround to support bundle on nodejs
    baseWebpackConfig.output.globalObject = `(typeof self !== 'undefined' ? self : this)`;
    return baseWebpackConfig;
  }
}

function resolveCustomWebpackConfig(path: string): CustomWebpackConfig {
  tsNodeRegister(path);

  const customWebpackConfig = require(path);
  // If the user provides a configuration in TS file
  // then there are 2 cases for exporing an object. The first one is:
  // `module.exports = { ... }`. And the second one is:
  // `export default { ... }`. The ESM format is compiled into:
  // `{ default: { ... } }`
  return customWebpackConfig.default || customWebpackConfig;
}
