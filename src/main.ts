import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
import { environment } from './environments/environment';
import { DynamicModuleService } from '@ng-dynamic-forms/core';

if (environment.production) {
  enableProdMode();
}
registerLocaleData(zh);
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then((appModule) => {
    // 加载异步模块
    const dynamicModuleService = appModule.injector.get(DynamicModuleService);
    dynamicModuleService.clear();
    dynamicModuleService.addModule(appModule);
  })
  .catch((err) => console.error(err));
