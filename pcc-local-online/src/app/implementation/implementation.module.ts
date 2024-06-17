import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Provider } from '@angular/compiler/src/core';
import { ImplementationRoutingModule } from './implementation-routing.module';
import { SharedModule } from './shared/shared.module';

import { DwSsoLoginModule } from '@webdpt/components/sso-login';
import { TaskProjectCenterConsoleModule } from './athena-app.module';

@NgModule({
  imports: [
    CommonModule,
    ImplementationRoutingModule,
    DwSsoLoginModule,
    // 共享模組
    SharedModule,
    TaskProjectCenterConsoleModule,
  ],
  declarations: [],
  providers: [],
})
export class ImplementationModule {
  static forRoot(providers: Provider[]): ModuleWithProviders<ImplementationModule> {
    return {
      ngModule: ImplementationModule,
      providers: [...SharedModule.forRoot([]).providers, ...providers],
    };
  }
}
