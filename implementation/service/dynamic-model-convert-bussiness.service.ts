import {
  DynamicFormControlModel,
  parseReviver, isString,
  DynamicFormModelConvertService,
  cloneDeep,
  CustomAppConfigService
} from '@ng-dynamic-forms/core';
import { Injectable } from '@angular/core';
import { CUSTOM_APP_CONFIG } from 'app/config/custom-app-config';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_ANALYSIS,
  DynamicProgressAnalysisModel
} from '../model/progress-analysis/progress-analysis.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_INFO_MAINTAIN,
  DynamicProjectInfoMaintainModel
} from '../model/project-info-maintain/project-info-maintain.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DETAIL,
  DynamicProjectDetailModel
} from '../model/project-detail/project-detail.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PROCESS_ROUTE,
  DynamicProjectProcessRouteModel
} from '../model/project-process-route/project-process-route.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_SFT_TASK_CARD,
  DynamicSftTaskCardModel
} from '../model/sft-task-card/sft-task-card.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_FRONT_TASK,
  DynamicFrontTaskModel
} from '../model/front-task/front-task.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE, DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE_DTD,
  DynamicProjectPlanManageModel
} from '../model/project-plan-manage/project-plan-manage.model';
import {
  DynamicPosumTaskCardModel, DYNAMIC_CUSTOM_PCC_MO_PROCESS_ASSIGNMENT, DYNAMIC_CUSTOM_PCC_MO_PROCESS_BPM_ASSIGNMENT, DYNAMIC_CUSTOM_PCC_MO_PROCESS_DTD_ASSIGNMENT_TASK_DETAIL_ALL, DYNAMIC_CUSTOM_PCC_PURCHASE_SUM_DTD_ASSIGNMENT_TASK_DETAIL_ALL, DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL, DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL_DTD, DYNAMIC_CUSTOM_PCC_TASK_DETAIL, DYNAMIC_CUSTOM_PCC_TASK_DETAIL_DTD
} from '../model/posum-task-card/posum-task-card.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_TRACK,
  DynamicProgressTrackModel,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_TRACK_DTD
} from '../model/progress-track/progress-track.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_COOPERATION_TASK,
  DynamicCooperationTaskModel,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_COOPERATION_TASK_DTD
} from '../model/cooperation-task/cooperation-task.model';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_BASIC_DATA_TEMPLATE_MANAGE, DynamicBasicDataTemplateManageModel } from '../model/basic-data-template-manage/basic-data-template-manage.model';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_TASK_CARD, DynamicApcTaskCardModel } from '../model/apc-task-card/apc-task-card.model';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_O_TASK_CARD, DynamicApcOTaskCardModel } from '../model/apc-o-task-card/apc-o-task-card.model';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DELIVERABLE, DynamicProjectDeliverableModel } from '../model/project-deliverable/project-deliverable.model';
@Injectable()
export class DynamicBusinessFormModelConvertService implements DynamicFormModelConvertService {
  constructor(
    public customAppConfigService: CustomAppConfigService
  ) { }

  fromOneJSON(
    json: string | object,
    content: any
  ): DynamicFormControlModel {
    let model;
    if (isString(json)) {
      model = isString(json);
    } else if (typeof json === 'object') {
      model = cloneDeep(json);
    } else {
      model = JSON.parse(JSON.stringify(json), parseReviver);
    }
    const layout = model.layout || null;
    let result: DynamicFormControlModel;
    model.content = content;
    switch (model.type) {
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DELIVERABLE:
        result = new DynamicProjectDeliverableModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_O_TASK_CARD:
        result = new DynamicApcOTaskCardModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_TASK_CARD:
        result = new DynamicApcTaskCardModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_BASIC_DATA_TEMPLATE_MANAGE:
        result = new DynamicBasicDataTemplateManageModel(model, layout);
        break;
      // 采购汇总任务卡 - 下面几个type指向同一个组件
      case DYNAMIC_CUSTOM_PCC_TASK_DETAIL:
        result = new DynamicPosumTaskCardModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_PCC_MO_PROCESS_DTD_ASSIGNMENT_TASK_DETAIL_ALL:
        result = new DynamicPosumTaskCardModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_PCC_MO_PROCESS_BPM_ASSIGNMENT:
        result = new DynamicPosumTaskCardModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_PCC_TASK_DETAIL_DTD:
        result = new DynamicPosumTaskCardModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_PCC_PURCHASE_SUM_DTD_ASSIGNMENT_TASK_DETAIL_ALL:
        result = new DynamicPosumTaskCardModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL:
        result = new DynamicPosumTaskCardModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL_DTD:
        result = new DynamicPosumTaskCardModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_PCC_MO_PROCESS_ASSIGNMENT:
        result = new DynamicPosumTaskCardModel(model, layout);
        break;
      // 协同任务卡（wbs页面）
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_COOPERATION_TASK:
        result = new DynamicCooperationTaskModel(model, layout);
        break;
      // 协同任务卡（wbs页面）DTD
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_COOPERATION_TASK_DTD:
        result = new DynamicCooperationTaskModel(model, layout);
        break;
      // 进度追踪
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_TRACK:
        result = new DynamicProgressTrackModel(model, layout);
        break;
      // 进度追踪 DTD
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_TRACK_DTD:
        result = new DynamicProgressTrackModel(model, layout);
        break;
      // 项目卡-项目计划维护
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE:
        result = new DynamicProjectPlanManageModel(model, layout);
        break;
      // 项目卡-项目计划维护 DTD
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE_DTD:
        result = new DynamicProjectPlanManageModel(model, layout);
        break;
      // 前置任务
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_FRONT_TASK:
        result = new DynamicFrontTaskModel(model, layout);
        break;
      // SFT任务卡
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_SFT_TASK_CARD:
        result = new DynamicSftTaskCardModel(model, layout);
        break;
      // 子项目信息
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PROCESS_ROUTE:
        result = new DynamicProjectProcessRouteModel(model, layout);
        break;
      // 任务卡-项目计划入口
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DETAIL:
        result = new DynamicProjectDetailModel(model, layout);
        break;
      // 母项目信息维护
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_INFO_MAINTAIN:
        result = new DynamicProjectInfoMaintainModel(model, layout);
        break;
      // 基础资料-专案模版维护
      // 进度分析
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_ANALYSIS:
        result = new DynamicProgressAnalysisModel(model, layout);
        break;
      default:
        break;
    }
    /** 渲染定制组件时，将应用信息传给service */
    if (!!result) { this.customAppConfigService.customConfig = CUSTOM_APP_CONFIG; }
    return result;
  }
}
