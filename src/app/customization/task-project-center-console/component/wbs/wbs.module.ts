import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DynamicWbsComponent } from './wbs.component';
// import { WbsHeaderComponent } from './components/wbs-header/wbs-header.component';
import { WbsDragComponent } from './components/wbs-drag/wbs-drag.component';
import { ProcessPercentComponent } from './components/process-percent/process-percent.component';
import { TaskDetailComponent } from './components/task-detail/task-detail.component';
import { ProgressTrackingCardComponent } from './components/progress-tracking-card/progress-tracking-card.component';
import { PertComponent } from './components/pert/pert.component';

import { CustSharedModule } from '../../shared.module';
import { DynamicWbsService } from './wbs.service';
import { ProjectPlanCardModule } from '../project-plan-card/project-plan-card.module';
import { AddSubprojectCardModule } from '../add-subproject-card/add-subproject-card.module';
import { InputNewModule } from '../input-new/input-new.module';
import { SvgFileModule } from '../svg-file/svg-file.module';
import { HumanResourceLoadModule } from '../human-resource-load/human-resource-load.module';
import { GanttModule } from '../gantt/gantt.module';
import { ApprovalProgressComponent } from './components/task-detail/components/approval-progress/approval-progress.component';
import { MesProjectComponent } from './components/task-detail/components/mes-project/mes-project.component';
import { PlmProjectComponent } from './components/task-detail/components/plm-project/plm-project.component';
import { ProjectDeliverableModule } from '../../dynamic-component/project-detail/project-deliverable/project-deliverable.module';

import { WbsHeaderModule } from './components/wbs-header/wbs-header.module';

@NgModule({
  providers: [
    DynamicWbsService
  ],
  declarations: [
    DynamicWbsComponent,
    // WbsHeaderComponent,
    WbsDragComponent,
    ProgressTrackingCardComponent,
    ProcessPercentComponent,
    TaskDetailComponent,
    PertComponent,
    ApprovalProgressComponent,
    MesProjectComponent,
    PlmProjectComponent
  ],
  imports: [
    CustSharedModule,
    ProjectPlanCardModule,
    AddSubprojectCardModule,
    InputNewModule,
    SvgFileModule,
    HumanResourceLoadModule,
    GanttModule,
    ProjectDeliverableModule,
    WbsHeaderModule
  ],
  exports: [
    DynamicWbsComponent
  ]
})
export class DynamicWbsModule { }
