import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared.module';
import { ProjectPlanManageComponent } from './project-plan-manage.component';
import { WbsTabsModule } from 'app/customization/task-project-center-console/component/wbs-tabs/wbs-tabs.module';

@NgModule({
  declarations: [ProjectPlanManageComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    WbsTabsModule
  ],
})
export class ProjectPlanManageModule {}
