import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DynamicWbsComponent } from './wbs.component';
// import { WbsHeaderComponent } from './components/wbs-header/wbs-header.component';
import { WbsDragComponent } from './components/wbs-drag/wbs-drag.component';
import { ProcessPercentComponent } from './components/process-percent/process-percent.component';
import { TaskDetailComponent } from './components/task-detail/task-detail.component';
import { ProgressTrackingCardComponent } from './components/progress-tracking-card/progress-tracking-card.component';
import { PertComponent } from './components/pert/pert.component';

import { CustSharedModule } from '../../shared/cust-shared.module';
import { DynamicWbsService } from './wbs.service';
import { ProjectPlanCardModule } from '../project-plan-card/project-plan-card.module';
import { ProjectTableModule } from '../project-table/project-table.module';
import { AddSubprojectCardModule } from '../add-subproject-card/add-subproject-card.module';
import { InputNewModule } from '../input-new/input-new.module';
import { SvgFileModule } from '../svg-file/svg-file.module';
import { HumanResourceLoadModule } from '../human-resource-load/human-resource-load.module';
import { GanttModule } from '../gantt/gantt.module';
import { ApprovalProgressComponent } from './components/task-detail/components/approval-progress/approval-progress.component';
import { MesProjectComponent } from './components/task-detail/components/mes-project/mes-project.component';
import { PlmProjectComponent } from './components/task-detail/components/plm-project/plm-project.component';
import { ProjectDeliverableModule } from '../../programs/project-detail/project-deliverable/project-deliverable.module';
import { AsscIsaOrderComponent } from './components/task-detail/components/assc-isa-order/assc-isa-order.component';

import { WbsHeaderModule } from './components/wbs-header/wbs-header.module';
import { CustWbsSharedModule } from 'app/implementation/shared/wbs-shared.module';
import { ProjectPlanCardV2Module } from '../project-plan-card-v2/project-plan-card.module';
import { ProgressTrackingCardV2Component } from './components/progress-tracking-card-v2/progress-tracking-card.component';
import { WbsCardModule } from './components/wbs-card/wbs-card.module';
import { ProjectPlanCardV2Service } from '../project-plan-card-v2/project-plan-card.service';
import { TaskWbsListService } from 'app/implementation/programs/task-detail/cooperation-task/components/task-wbs-list/task-wbs-list.service';
import { AcTableModule } from '@app-custom/ui/ac-table';
import { TaskDetailIndividualCaseModule } from 'app/implementation/individual-case/task-detail/task-detail.module';
import { CustPccScrollbarDirective } from 'app/implementation/directive/scroll-bar.directive';
import { ObserversModule } from '@angular/cdk/observers';
@NgModule({
  providers: [DynamicWbsService, ProjectPlanCardV2Service, TaskWbsListService],
  declarations: [
    CustPccScrollbarDirective,
    DynamicWbsComponent,
    // WbsHeaderComponent,
    WbsDragComponent,
    ProgressTrackingCardComponent,
    ProgressTrackingCardV2Component,
    ProcessPercentComponent,
    TaskDetailComponent,
    PertComponent,
    ApprovalProgressComponent,
    MesProjectComponent,
    PlmProjectComponent,
    AsscIsaOrderComponent,
  ],
  imports: [
    CustSharedModule,
    CustWbsSharedModule,
    ProjectPlanCardModule,
    ProjectPlanCardV2Module,
    ProjectTableModule,
    AddSubprojectCardModule,
    InputNewModule,
    SvgFileModule,
    HumanResourceLoadModule,
    GanttModule,
    ProjectDeliverableModule,
    WbsHeaderModule,
    WbsCardModule,
    AcTableModule,
    ObserversModule,
    TaskDetailIndividualCaseModule,
  ],
  exports: [DynamicWbsComponent],
})
export class DynamicWbsModule {}
