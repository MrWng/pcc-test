import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { ProjectDetailComponent } from './project-detail.component';
import { WbsTabsModule } from 'app/implementation/component/wbs-tabs/wbs-tabs.module';

@NgModule({
  declarations: [ProjectDetailComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    WbsTabsModule
  ],
})
export class ProjectDetailModule {}
