import { BrowserBuilderOptions } from '@angular-devkit/build-angular';

export interface PluginBuilderSchema extends BrowserBuilderOptions {
  /**
   * A string of the form `path/to/file#exportName` that acts as a path to include to bundle
   */
  modulePath: string;
  
  /**
   * A name of compiled bundle
   */
  pluginName: string;
  
  /**
   * A comma-delimited list of shared lib names used by current plugin
   */
  sharedLibs: string;
  
  indexTransform: string;
}
