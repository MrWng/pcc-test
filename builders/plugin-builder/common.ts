import { BuilderContext } from '@angular-devkit/architect';
import { ExecutionTransformer } from '@angular-devkit/build-angular';
import { normalize, getSystemPath } from '@angular-devkit/core';

import { Configuration } from 'webpack';

import { CustomWebpackBuilder } from './custom-webpack-builder';
import { tsNodeRegister } from './utils';
import { PluginBuilderSchema } from './plugin-schema';
import { IndexHtmlTransform } from '@angular-devkit/build-angular/src/utils/index-file/index-html-generator';

export const customWebpackConfigTransformFactory: (
  options: PluginBuilderSchema,
  context: BuilderContext
) => ExecutionTransformer<Configuration> = (options, { workspaceRoot, target }) => browserWebpackConfig => {
  return CustomWebpackBuilder.buildWebpackConfig(
    normalize(workspaceRoot),
    options,
    browserWebpackConfig,
    options,
    target
  );
};

export const indexHtmlTransformFactory: (
  options: PluginBuilderSchema,
  context: BuilderContext
) => IndexHtmlTransform = ({ indexTransform }, { workspaceRoot, target }) => {
  if (!indexTransform) return null;
  tsNodeRegister(indexTransform);
  const indexModule = require(`${getSystemPath(normalize(workspaceRoot))}/${indexTransform}`);
  const transform = indexModule.default || indexModule;
  return async (indexHtml: string) => transform(target, indexHtml);
};

export const getTransforms = (options: PluginBuilderSchema, context: BuilderContext) => ({
  webpackConfiguration: customWebpackConfigTransformFactory(options, context),
  indexHtml: indexHtmlTransformFactory(options, context),
});
