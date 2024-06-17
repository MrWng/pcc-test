import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { DynamicWbsTabsComponent } from './wbs-tabs.component';
import { StartProjectComponent } from './components/start-project/start-project.component';
import { DynamicWbsModule } from '../wbs/wbs.module';
import { ProjectCreationComponent } from './components/project-creation/project-creation.component';

import { AccountsPeriodizationComponent } from './components/accounts-periodization/accounts-periodization.component';
import { InputNewModule } from '../input-new/input-new.module';
import { SvgFileModule } from '../svg-file/svg-file.module';
import { ListOfDeliverableModule } from '../list-of-deliverable/list-of-deliverable.module';
import { ListOfDepartmentModule } from '../list-of-department/list-of-department.module';
// 光斯奥项目计划维护其他信息个案组件
import { ProjPlanOtherInfoComponent } from '../../individual-case/proj-plan-other-info/proj-plan-other-info.component';
import { PccRiskMaintenanceModule } from './components/risk-maintenance/risk-maintenance.module';
import { PccFilterFormItemDirective } from './directive';
import { ExistPipe, DomTitlePipe } from './pipe';
import { LoadingModalModule } from '../loading-modal/loading-modal.module';
import { ListOfDeliverableV2Module } from '../list-of-deliverable-v2/list-of-deliverable.module';
import { AcOperationButtonSaveModule } from '@app-custom/ui/operation-button-save';
import { ListOfDepartmentV2Module } from '../list-of-department-v2/list-of-department.module';

const directives = [PccFilterFormItemDirective];
const pipes = [ExistPipe, DomTitlePipe];
@NgModule({
  declarations: [
    DynamicWbsTabsComponent,
    StartProjectComponent,
    ProjectCreationComponent,
    AccountsPeriodizationComponent,
    ProjPlanOtherInfoComponent,
    ...directives,
    ...pipes,
  ],
  imports: [
    CommonModule,
    CustSharedModule,
    DynamicWbsModule,
    InputNewModule,
    SvgFileModule,
    ListOfDeliverableModule,
    ListOfDeliverableV2Module,
    ListOfDepartmentModule,
    ListOfDepartmentV2Module,
    PccRiskMaintenanceModule,
    LoadingModalModule,
    AcOperationButtonSaveModule,
  ],
  exports: [DynamicWbsTabsComponent, ProjectCreationComponent],
})
export class WbsTabsModule {}
