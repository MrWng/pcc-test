"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomWebpackBuilder = exports.defaultWebpackConfigPath = void 0;
const utils_1 = require("./utils");
exports.defaultWebpackConfigPath = 'webpack.config.js';
class CustomWebpackBuilder {
    static buildWebpackConfig(root, selfOption, baseWebpackConfig, buildOptions, targetOptions) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const ngCompilerPluginInstance = baseWebpackConfig.plugins.find((x) => x.constructor && x.constructor.name === 'AngularCompilerPlugin');
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
        });
    }
}
exports.CustomWebpackBuilder = CustomWebpackBuilder;
function resolveCustomWebpackConfig(path) {
    utils_1.tsNodeRegister(path);
    const customWebpackConfig = require(path);
    // If the user provides a configuration in TS file
    // then there are 2 cases for exporing an object. The first one is:
    // `module.exports = { ... }`. And the second one is:
    // `export default { ... }`. The ESM format is compiled into:
    // `{ default: { ... } }`
    return customWebpackConfig.default || customWebpackConfig;
}
