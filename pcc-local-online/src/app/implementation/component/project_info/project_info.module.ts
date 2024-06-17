import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { ProjectInfoComponent } from './project_info.component';
import { DynamicWbsModule } from 'app/implementation/component/wbs/wbs.module';
import { ProjectPlanCardModule } from 'app/implementation/component/project-plan-card/project-plan-card.module';
import { WbsTabsModule } from 'app/implementation/component/wbs-tabs/wbs-tabs.module';
import { AddSubprojectCardModule } from 'app/implementation/component/add-subproject-card/add-subproject-card.module';
import { AcModalTabsModule } from '@app-custom/ui/modal-tabs';

@NgModule({
  declarations: [ProjectInfoComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    DynamicWbsModule,
    ProjectPlanCardModule,
    WbsTabsModule,
    AddSubprojectCardModule,
    AcModalTabsModule,
  ],
  exports: [ProjectInfoComponent],
})
export class ProjectInfoModule {}
