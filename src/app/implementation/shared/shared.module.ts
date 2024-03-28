import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Provider } from '@angular/compiler/src/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormsAntUIModule } from '@ng-dynamic-forms/ui-ant-web';
import { TranslateModule } from '@ngx-translate/core';
import { TaskContentComponent } from '../layout/drawer/task-content/task-content.component';
import { EmailLayoutComponent } from '../programs/email-layout/email-layout.component';
import { MenuBarComponent } from '../layout/menu-bar/menu-bar.component';
import { DwExceptionModule } from '@webdpt/components/exception';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzI18nModule } from 'ng-zorro-antd/i18n';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';

/* 共享组件 */
const sharedComponents = [EmailLayoutComponent, TaskContentComponent, MenuBarComponent];

/**
 * 共享模組
 * @export
 * @class SharedModule
 */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DynamicFormsAntUIModule,
    TranslateModule,
    NzMessageModule,
    NzNotificationModule,
    NzI18nModule,
    NzSpinModule,
    NzDropDownModule,
    NzIconModule,
    NzMenuModule,
  ],
  declarations: [...sharedComponents],
  exports: [
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    DynamicFormsAntUIModule,
    CommonModule,
    ...sharedComponents,
    DwExceptionModule,
  ],
  providers: [DatePipe],
})
export class SharedModule {
  static forRoot(providers: Provider[]): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
      providers: [...providers],
    };
  }
}
