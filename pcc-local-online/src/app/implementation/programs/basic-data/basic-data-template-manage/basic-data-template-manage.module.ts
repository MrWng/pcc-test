import { NgModule } from '@angular/core';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { DynamicWbsModule } from 'app/implementation/component/wbs/wbs.module';
import { MqttService } from '@athena/dynamic-core';
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
