import { NgModule } from '@angular/core';
import { CustSharedModule } from '../../../shared.module';
import { DynamicWbsModule } from 'app/customization/task-project-center-console/component/wbs/wbs.module';
import { MqttService } from '@ng-dynamic-forms/core';
import { BasicDataTemplateManageComponent } from './basic-data-template-manage.component';

@NgModule({
  declarations: [
    BasicDataTemplateManageComponent
  ],
  imports: [
    CustSharedModule,
    DynamicWbsModule
  ],
  providers: [
    MqttService,
  ]
})
export class BasicDataTemplateManageModule {}
