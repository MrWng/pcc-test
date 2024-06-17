import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { ProjectChangeTaskComponent } from './project-change-task.component';
import { AddSubprojectCardModule } from '../../../component/add-subproject-card/add-subproject-card.module';
import { HumanResourceLoadModule } from '../../../component/human-resource-load/human-resource-load.module';
import { ListOfDeliverableModule } from '../../../component/list-of-deliverable/list-of-deliverable.module';
import { ProjectPlanCardModule } from '../../../component/project-plan-card/project-plan-card.module';
import { DynamicWbsModule } from '../../../component/wbs/wbs.module';
import { WbsTabsModule } from '../../../component/wbs-tabs/wbs-tabs.module';
import { ListOfDepartmentModule } from '../../../component/list-of-department/list-of-department.module';
import { CustWbsSharedModule } from 'app/implementation/shared/wbs-shared.module';
import { ListOfDeliverableV2Module } from 'app/implementation/component/list-of-deliverable-v2/list-of-deliverable.module';
import { AcOperationButtonSaveModule } from '@app-custom/ui/operation-button-save';
import { ListOfDepartmentV2Module } from 'app/implementation/component/list-of-department-v2/list-of-department.module';

@NgModule({
  declarations: [ProjectChangeTaskComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    CustWbsSharedModule,
    AddSubprojectCardModule,
    HumanResourceLoadModule,
    ListOfDeliverableModule,
    ListOfDeliverableV2Module,
    ProjectPlanCardModule,
    DynamicWbsModule,
    WbsTabsModule,
    ListOfDepartmentModule,
    ListOfDepartmentV2Module,
    AcOperationButtonSaveModule,
  ],
})
export class ProjectChangeTaskModule {}
