import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared.module';
import { ProjectDetailComponent } from './project-detail.component';
import { WbsTabsModule } from 'app/customization/task-project-center-console/component/wbs-tabs/wbs-tabs.module';

@NgModule({
  declarations: [ProjectDetailComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    WbsTabsModule
  ],
})
export class ProjectDetailModule {}
