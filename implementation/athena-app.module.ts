import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DYNAMIC_FORM_CONTROL_MAP_FNS, DYNAMIC_FORM_MODEL_CONVERTS } from '@ng-dynamic-forms/core';
import { AgGridModule } from 'ag-grid-angular';
import { businessUIFormComponentMapFn } from './service/business-dynamic-component-map';
import { DynamicBusinessFormModelConvertService } from './service/dynamic-model-convert-bussiness.service';
import { CommonService } from './service/common.service';
import { ProgressAnalysisModule } from './dynamic-component/basic-data/progress-analysis/progress-analysis.module';
import { ProjectInfoMaintainModule } from './dynamic-component/project-detail/project-info-maintain/project-info-maintain.module';
import { ProjectProcessRouteModule } from './dynamic-component/project-detail/project-process-route/project-process-route.module';
import { SftTaskCardModule } from './dynamic-component/task-detail/sft-task-card/sft-task-card.module';
import { FrontTaskModule } from './dynamic-component/task-detail/front-task/front-task.module';
import { ProjectDetailModule } from './dynamic-component/task-detail/project-detail/project-detail.module';
import { ProjectPlanManageModule } from './dynamic-component/project-detail/project-plan-manage/project-plan-manage.module';
import { ProgressTrackModule } from './dynamic-component/project-detail/progress-track/progress-track.module';
import { CooperationTaskModule } from './dynamic-component/task-detail/cooperation-task/cooperation-task.module';
import { PosumTaskCardModule } from './dynamic-component/task-detail/posum-task-card/posum-task-card.module';
import { BasicDataTemplateManageModule } from './dynamic-component/basic-data/basic-data-template-manage/basic-data-template-manage.module';
import { ApcTaskCardModule } from './dynamic-component/task-detail/apc-task-card/apc-task-card.module';
import { ApcOTaskCardModule } from './dynamic-component/task-detail/apc-o-task-card/apc-o-task-card.module';
import { ProjectDeliverableModule } from './dynamic-component/project-detail/project-deliverable/project-deliverable.module';


// 定制页集合
const dynamicModules = [
  ProjectDeliverableModule,
  ApcOTaskCardModule,
  ApcTaskCardModule,
  BasicDataTemplateManageModule,
  PosumTaskCardModule,
  CooperationTaskModule,
  ProgressTrackModule,
  ProjectPlanManageModule,
  FrontTaskModule,
  SftTaskCardModule,
  ProjectProcessRouteModule,
  ProjectDetailModule,
  ProjectInfoMaintainModule,
  ProgressAnalysisModule,
];

const components = [
];

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
    }
  ],
  imports: [
    CommonModule,
    ...dynamicModules
  ],
  declarations: [...components],
  entryComponents: [...components],
  exports: [...components],
})
export class TaskProjectCenterConsoleModule { }
