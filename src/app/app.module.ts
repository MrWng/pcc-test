import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HttpClientJsonpModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { FrameworkModule, DwIamModule, DW_LANG_LOADER } from '@webdpt/framework';
import { SystemModule } from './config/system.module';
import { ImplementationModule } from './implementation/implementation.module';
import { SYSTEM_CONFIG } from './config/system-config';
import { NzDateConfig, NZ_DATE_CONFIG, NZ_I18N, zh_CN } from 'ng-zorro-antd/i18n';
import { NzConfig, NZ_CONFIG } from 'ng-zorro-antd/core/config';
import { ReactiveFormsModule } from '@angular/forms';
import { AppErrorHandleService } from './implementation/http-error-handle.service';
import { HttpInterceptorService } from './implementation/http-interceptor.service';
import { DynamicFormsAntUIModule } from '@ng-dynamic-forms/ui-ant-web';
import {
  DynamicFormsCoreModule,
  DynamicUserBehaviorService,
  PluginLanguageStoreService,
  PluginsConfigProvider, UserOrgInfoService,
  DynamicUserBehaviorCommService,  isEmpty,
} from '@ng-dynamic-forms/core';
import { PluginLangLoaderService } from './implementation/language/plugin-lang-loader.service';
import { loadAllPluginI18nJsonFactory } from './implementation/language/nz-i18-change-factory';


// 蚂蚁金服UI的全局配置
const ngZorroConfig: NzConfig = {
  message: {
    nzTop: 'calc(50% - 20px)',
    nzDuration: 2000,
  },
  notification: {
    nzPlacement: 'bottomRight',
  },
};

const ngZorroDateConfig: NzDateConfig = {
  firstDayOfWeek: 0,
};

@NgModule({
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    HttpClientJsonpModule,
    FrameworkModule.forRoot([], SYSTEM_CONFIG),
    DwIamModule,
    SystemModule.forRoot([]),
    DynamicFormsAntUIModule.forRoot(),
    DynamicFormsCoreModule.forRoot(),
    ImplementationModule.forRoot([]),
  ],
  declarations: [AppComponent],
  providers: [
    // 默认使用中文简体，怎么根据本地设置的语言设置
    { provide: NZ_I18N, useValue: zh_CN },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    },
    { provide: ErrorHandler, useClass: AppErrorHandleService },
    { provide: NZ_CONFIG, useValue: ngZorroConfig },
    { provide: NZ_DATE_CONFIG, useValue: ngZorroDateConfig },
    ...DynamicFormsCoreModule.forRoot().providers,
    // 插件相关json
    PluginLanguageStoreService,
    UserOrgInfoService,
    DynamicUserBehaviorCommService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(
    private userBehaviorService: DynamicUserBehaviorService,
    private userOrgInfoService: UserOrgInfoService,
  ) {
    this.userBehaviorService.init();
    this.userOrgInfoService.monitorLogin();
  }
}
