import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared.module';
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
@NgModule({
  declarations: [
    DynamicWbsTabsComponent,
    StartProjectComponent,
    ProjectCreationComponent,
    AccountsPeriodizationComponent,
    ProjPlanOtherInfoComponent,
  ],
  imports: [
    CommonModule,
    CustSharedModule,
    DynamicWbsModule,
    InputNewModule,
    SvgFileModule,
    ListOfDeliverableModule,
    ListOfDepartmentModule,
  ],
  exports: [DynamicWbsTabsComponent],
})
export class WbsTabsModule {}
