import { DynamicFormControl, DynamicFormControlModel } from '@ng-dynamic-forms/core';
import { Type } from '@angular/core';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_ANALYSIS } from '../model/progress-analysis/progress-analysis.model';
import { ProgressAnalysisComponent } from '../dynamic-component/basic-data/progress-analysis/progress-analysis.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_INFO_MAINTAIN }
  from '../model/project-info-maintain/project-info-maintain.model';
import { ProjectInfoMaintainComponent } from '../dynamic-component/project-detail/project-info-maintain/project-info-maintain.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PROCESS_ROUTE }
  from '../model/project-process-route/project-process-route.model';
import { ProjectProcessRouteComponent } from '../dynamic-component/project-detail/project-process-route/project-process-route.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_SFT_TASK_CARD } from '../model/sft-task-card/sft-task-card.model';
import { SftTaskCardComponent } from '../dynamic-component/task-detail/sft-task-card/sft-task-card.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_FRONT_TASK } from '../model/front-task/front-task.model';
import { FrontTaskComponent } from '../dynamic-component/task-detail/front-task/front-task.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DETAIL } from '../model/project-detail/project-detail.model';
import { ProjectDetailComponent } from '../dynamic-component/task-detail/project-detail/project-detail.component';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE_DTD
} from '../model/project-plan-manage/project-plan-manage.model';
import { ProjectPlanManageComponent } from '../dynamic-component/project-detail/project-plan-manage/project-plan-manage.component';
import {
  DYNAMIC_CUSTOM_PCC_MO_PROCESS_ASSIGNMENT,
  DYNAMIC_CUSTOM_PCC_MO_PROCESS_BPM_ASSIGNMENT,
  DYNAMIC_CUSTOM_PCC_PURCHASE_SUM_DTD_ASSIGNMENT_TASK_DETAIL_ALL,
  DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL,
  DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL_DTD,
  DYNAMIC_CUSTOM_PCC_TASK_DETAIL,
  DYNAMIC_CUSTOM_PCC_TASK_DETAIL_DTD,
  DYNAMIC_CUSTOM_PCC_MO_PROCESS_DTD_ASSIGNMENT_TASK_DETAIL_ALL
} from '../model/posum-task-card/posum-task-card.model';
import { PosumTaskCardComponent } from '../dynamic-component/task-detail/posum-task-card/posum-task-card.component';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_TRACK,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_TRACK_DTD
} from '../model/progress-track/progress-track.model';
import { ProgressTrackComponent } from '../dynamic-component/project-detail/progress-track/progress-track.component';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_COOPERATION_TASK,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_COOPERATION_TASK_DTD
} from '../model/cooperation-task/cooperation-task.model';
import { CooperationTaskComponent } from '../dynamic-component/task-detail/cooperation-task/cooperation-task.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_BASIC_DATA_TEMPLATE_MANAGE } from '../model/basic-data-template-manage/basic-data-template-manage.model';
import { BasicDataTemplateManageComponent } from '../dynamic-component/basic-data/basic-data-template-manage/basic-data-template-manage.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_TASK_CARD } from '../model/apc-task-card/apc-task-card.model';
import { ApcTaskCardComponent } from '../dynamic-component/task-detail/apc-task-card/apc-task-card.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_O_TASK_CARD } from '../model/apc-o-task-card/apc-o-task-card.model';
import { ApcOTaskCardComponent } from '../dynamic-component/task-detail/apc-o-task-card/apc-o-task-card.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DELIVERABLE } from '../model/project-deliverable/project-deliverable.model';
import { ProjectDeliverableComponent } from '../dynamic-component/project-detail/project-deliverable/project-deliverable.component';
export function businessUIFormComponentMapFn(
  model: DynamicFormControlModel
): Type<DynamicFormControl> | null {
  switch (model.type) {
    // 项目卡交付物
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DELIVERABLE:
      return ProjectDeliverableComponent;
    // apc-o任务卡
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_O_TASK_CARD:
      return ApcOTaskCardComponent;
    // APC任务卡
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_TASK_CARD:
      return ApcTaskCardComponent;
    // 基础资料-专案模版维护
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_BASIC_DATA_TEMPLATE_MANAGE:
      return BasicDataTemplateManageComponent;
    // 采购汇总任务卡 - 下面几个type指向同一个组件
    case DYNAMIC_CUSTOM_PCC_TASK_DETAIL:
      return PosumTaskCardComponent;
    case DYNAMIC_CUSTOM_PCC_MO_PROCESS_DTD_ASSIGNMENT_TASK_DETAIL_ALL:
      return PosumTaskCardComponent;
    case DYNAMIC_CUSTOM_PCC_MO_PROCESS_BPM_ASSIGNMENT:
      return PosumTaskCardComponent;
    case DYNAMIC_CUSTOM_PCC_TASK_DETAIL_DTD:
      return PosumTaskCardComponent;
    case DYNAMIC_CUSTOM_PCC_PURCHASE_SUM_DTD_ASSIGNMENT_TASK_DETAIL_ALL:
      return PosumTaskCardComponent;
    case DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL:
      return PosumTaskCardComponent;
    case DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL_DTD:
      return PosumTaskCardComponent;
    case DYNAMIC_CUSTOM_PCC_MO_PROCESS_ASSIGNMENT:
      return PosumTaskCardComponent;
    // 协同任务卡（wbs页面）
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_COOPERATION_TASK:
      return CooperationTaskComponent;
    // 协同任务卡（wbs页面）DTD
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_COOPERATION_TASK_DTD:
      return CooperationTaskComponent;
    // 进度追踪
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_TRACK:
      return ProgressTrackComponent;
    // 进度追踪 DTD
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_TRACK_DTD:
      return ProgressTrackComponent;
    // 项目卡-项目计划维护
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE:
      return ProjectPlanManageComponent;
    // 项目卡-项目计划维护 DTD
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE_DTD:
      return ProjectPlanManageComponent;
    // 前置任务
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_FRONT_TASK:
      return FrontTaskComponent;
    // SFT任务卡
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_SFT_TASK_CARD:
      return SftTaskCardComponent;
    // 子项目信息
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PROCESS_ROUTE:
      return ProjectProcessRouteComponent;
    // 任务卡-项目计划入口
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DETAIL:
      return ProjectDetailComponent;
    // 母项目信息维护
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_INFO_MAINTAIN:
      return ProjectInfoMaintainComponent;
    // 进度分析
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_ANALYSIS:
      return ProgressAnalysisComponent;
    default:
      break;
  }
  return null;
}
