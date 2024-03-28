import { BuilderContext, createBuilder } from '@angular-devkit/architect';
import { executeBrowserBuilder } from '@angular-devkit/build-angular';
import { json } from '@angular-devkit/core';
import { PluginBuilderSchema } from './plugin-schema';
import { getTransforms } from './common';


export function buildCustomWebpackBrowser(
  options: PluginBuilderSchema,
  context: BuilderContext
): any {
  //@ts-ignore
  return executeBrowserBuilder(options, context, getTransforms(options, context));
}

export default createBuilder<json.JsonObject & PluginBuilderSchema>(
  buildCustomWebpackBrowser
);
