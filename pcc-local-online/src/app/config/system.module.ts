import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Provider } from '@angular/compiler/src/core';

import { DW_APP_AUTH_TOKEN, DW_MOCK } from '@webdpt/framework/config';
import { DwMockModule } from '@webdpt/framework/mock';
import { environment } from '../../environments/environment';
import { DigiMiddlewareAuthApp } from './app-auth-token';


@NgModule({
  imports: [
    CommonModule,
    DwMockModule
  ],
  declarations: []
})

export class SystemModule {
  static forRoot(providers: Provider[]): ModuleWithProviders<SystemModule> {
    return {
      ngModule: SystemModule,
      providers: [

        {
          provide: DW_MOCK,
          useValue: environment.mock
        },
        {
          provide: DW_APP_AUTH_TOKEN,
          useValue: DigiMiddlewareAuthApp
        },

        ...providers
      ]
    };
  }
}
