import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DYNAMIC_FORM_CONTROL_MAP_FNS,
  DYNAMIC_FORM_MODEL_CONVERTS,
  PLUGIN_LANGUAGE_CHECKLIST,
} from '@athena/dynamic-core';
import { AgGridModule } from 'ag-grid-angular';
import { businessUIFormComponentMapFn } from './service/business-dynamic-component-map';
import { DynamicBusinessFormModelConvertService } from './service/dynamic-model-convert-bussiness.service';
import { CommonService } from './service/common.service';
import { ProgressAnalysisModule } from './programs/basic-data/progress-analysis/progress-analysis.module';
import { ProjectInfoMaintainModule } from './programs/project-detail/project-info-maintain/project-info-maintain.module';
import { ProjectProcessRouteModule } from './programs/project-detail/project-process-route/project-process-route.module';
import { SftTaskCardModule } from './programs/task-detail/sft-task-card/sft-task-card.module';
import { FrontTaskModule } from './programs/task-detail/front-task/front-task.module';
import { ManualWorkReportingModule } from './programs/task-detail/manual-work-reporting/manual-work-reporting.module';
import { QuestionQuickModule } from './programs/task-detail/question-quick/question-quick.module';
import { ProjectDetailModule } from './programs/task-detail/project-detail/project-detail.module';
import { ProjectPlanManageModule } from './programs/project-detail/project-plan-manage/project-plan-manage.module';
import { ProgressTrackModule } from './programs/project-detail/progress-track/progress-track.module';
import { CooperationTaskModule } from './programs/task-detail/cooperation-task/cooperation-task.module';
import { ProjectChangeTaskModule } from './programs/task-detail/project-change-task/project-change-task.module';
import { ProjectChangeTaskWaittingModule } from './programs/task-detail/project-change-task-waitting/project-change-task-waitting.module';
import { PosumTaskCardModule } from './programs/task-detail/posum-task-card/posum-task-card.module';
import { BasicDataTemplateManageModule } from './programs/basic-data/basic-data-template-manage/basic-data-template-manage.module';
import { ApcTaskCardModule } from './programs/task-detail/apc-task-card/apc-task-card.module';
import { ApcOTaskCardModule } from './programs/task-detail/apc-o-task-card/apc-o-task-card.module';
import { ProjectDeliverableModule } from './programs/project-detail/project-deliverable/project-deliverable.module';
import { PccProjectGanttModule } from './programs/pcc-project-gantt/pcc-project-gantt.module';
import { PccRiskMaintenanceTableAddModule } from './programs/project-detail/pcc-risk-maintenance-table-add/pcc-risk-maintenance-table-add.module';
import { PccRiskMaintenanceTableOperateModule } from './programs/project-detail/pcc-risk-maintenance-table-operate/pcc-risk-maintenance-table-operate.module';
import { APP_LANGUAGE_CHECKLIST } from './language';
import { CustomizedProjectSubmitModule } from './programs/task-detail/customized-project-submit/customized-project-submit.module';
import { GaosiaoOtherInfoModule } from './programs/individual-case/gaosiao-other-info/gaosiao-other-info.module';
import { ReportProjectQuestionModule } from './programs/report-project-question-bulletin-board/report-project-question-bulletin-board.module';

// 定制页集合
const dynamicModules = [
  PccRiskMaintenanceTableOperateModule,
  PccRiskMaintenanceTableAddModule,
  ProjectDeliverableModule,
  ApcOTaskCardModule,
  ApcTaskCardModule,
  BasicDataTemplateManageModule,
  PosumTaskCardModule,
  CooperationTaskModule,
  ProjectChangeTaskModule,
  ProjectChangeTaskWaittingModule,
  ProgressTrackModule,
  ProjectPlanManageModule,
  FrontTaskModule,
  ManualWorkReportingModule,
  QuestionQuickModule,
  SftTaskCardModule,
  ProjectProcessRouteModule,
  ProjectDetailModule,
  ProjectInfoMaintainModule,
  ProgressAnalysisModule,
  PccProjectGanttModule,
  CustomizedProjectSubmitModule,
  GaosiaoOtherInfoModule,
  ReportProjectQuestionModule
];

const components = [];

@NgModule({
  providers: [
    {
      provide: DYNAMIC_FORM_CONTROL_MAP_FNS,
      useValue: businessUIFormComponentMapFn,
      multi: true,
    },
    {
      provide: DYNAMIC_FORM_MODEL_CONVERTS,
      useClass: DynamicBusinessFormModelConvertService,
      multi: true,
    },
    {
      provide: PLUGIN_LANGUAGE_CHECKLIST,
      useValue: APP_LANGUAGE_CHECKLIST,
      multi: true,
    },
  ],
  imports: [CommonModule, ...dynamicModules],
  declarations: [...components],
  entryComponents: [...components],
  exports: [...components],
})
export class TaskProjectCenterConsoleModule {}
