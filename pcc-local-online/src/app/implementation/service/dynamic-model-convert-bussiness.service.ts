import {
  DynamicFormControlModel,
  parseReviver,
  isString,
  DynamicFormModelConvertService,
  cloneDeep,
  CustomAppConfigService,
} from '@athena/dynamic-core';
import { Injectable } from '@angular/core';
import { CUSTOM_APP_CONFIG } from 'app/config/custom-app-config';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_ANALYSIS,
  DynamicProgressAnalysisModel,
} from '../model/progress-analysis/progress-analysis.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_INFO_MAINTAIN,
  DynamicProjectInfoMaintainModel,
} from '../model/project-info-maintain/project-info-maintain.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DETAIL,
  DynamicProjectDetailModel,
} from '../model/project-detail/project-detail.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PROCESS_ROUTE,
  DynamicProjectProcessRouteModel,
} from '../model/project-process-route/project-process-route.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_SFT_TASK_CARD,
  DynamicSftTaskCardModel,
} from '../model/sft-task-card/sft-task-card.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_FRONT_TASK,
  DynamicFrontTaskModel,
} from '../model/front-task/front-task.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE_DTD,
  DynamicProjectPlanManageModel,
} from '../model/project-plan-manage/project-plan-manage.model';
import {
  DynamicPosumTaskCardModel,
  DYNAMIC_CUSTOM_PCC_MO_PROCESS_ASSIGNMENT,
  DYNAMIC_CUSTOM_PCC_MO_PROCESS_BPM_ASSIGNMENT,
  DYNAMIC_CUSTOM_PCC_MO_PROCESS_DTD_ASSIGNMENT_TASK_DETAIL_ALL,
  DYNAMIC_CUSTOM_PCC_PURCHASE_SUM_DTD_ASSIGNMENT_TASK_DETAIL_ALL,
  DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL,
  DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL_DTD,
  DYNAMIC_CUSTOM_PCC_TASK_DETAIL,
  DYNAMIC_CUSTOM_PCC_TASK_DETAIL_DTD,
} from '../model/posum-task-card/posum-task-card.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_TRACK,
  DynamicProgressTrackModel,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_TRACK_DTD,
} from '../model/progress-track/progress-track.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_COOPERATION_TASK,
  DynamicCooperationTaskModel,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_COOPERATION_TASK_DTD,
} from '../model/cooperation-task/cooperation-task.model';
import {
  DynamicProjectChangeTaskModel,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_DTD,
} from '../model/project-change-task/project-change-task.model';
import {
  DynamicProjectChangeTaskWaittingModel,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_DTD,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_ABNORMAL,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_ABNORMAL_DTD,
} from '../model/project-change-task-waitting/project-change-task-waitting.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_BASIC_DATA_TEMPLATE_MANAGE,
  DynamicBasicDataTemplateManageModel,
} from '../model/basic-data-template-manage/basic-data-template-manage.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_TASK_CARD,
  DynamicApcTaskCardModel,
} from '../model/apc-task-card/apc-task-card.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_O_TASK_CARD,
  DynamicApcOTaskCardModel,
} from '../model/apc-o-task-card/apc-o-task-card.model';
import {
  DYNAMIC_CUSTOM_PCC_PROJECT_GANTT_CONDITION_DETAIL,
  DynamicPccProjectGanttModel,
} from '../model/pcc-project-gantt/pcc-project-gantt.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DELIVERABLE,
  DynamicProjectDeliverableModel,
} from '../model/project-deliverable/project-deliverable.model';
import {
  DYNAMIC_CUSTOM_PCC_SHOW_EXECUTOR_REPORTSWORK,
  DynamicManualWorkReportingModel,
} from '../model/manual-work-reporting/manual-work-reporting.model';
import {
  DYNAMIC_CUSTOM_PCC_SHOW_PROBLEM_FEEDBACK,
  QuestionQuickModel,
} from '../model/question-quick/question-quick.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_RISK_MAINTENANCE_TABLE_ADD,
  DynamicPccRiskMaintenanceTableAddModel,
} from '../model/pcc-risk-maintenance-table-add/pcc-risk-maintenance-table-add.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_RISK_MAINTENANCE_TABLE_OPERATE,
  DynamicPccRiskMaintenanceTableOperateModel,
} from '../model/pcc-risk-maintenance-table-operate/pcc-risk-maintenance-table-operate.model';
import {
  DYNAMIC_CUSTOM_PCC_START_CUSTOM_COMPONENT,
  CustomizedProjectSubmitModel,
} from '../model/customized-project-submit/customized-project-submit.model';
/** 应用组件库多语言服务 */
import { DwLanguageService } from '@webdpt/framework/language';
import { AcI18nService, en_US, zh_CN, zh_TW } from '@app-custom/ui/i18n';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_PROBLEM_HANDLING,
  DYNAMIC_CUSTOM_TASK_DataEntry_pccProjectQuestionList,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_task_0013_task_detail_waitting,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_task_0014_task_detail,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_pcc_problem_handling,
  DynamicPccProblemHandlingModel,
} from '../model/pcc-problem-handling/pcc-problem-handling.model';
import {
  DYNAMIC_CUSTOM_TASK_TECHNICAL_SCHEME_DYNAMIC_ATTACHMENT,
  PccDynamicDynamicAttachmentModel,
} from '../model/pcc-attachment/dynamic-attachment.model';
import {
  DYNAMIC_CUSTOM__ATHENA_GAOSIAO_OTHER_INFO,
  DynamicGaosiaoOtherInfoModel,
} from '../model/gaosiao-other-info/gaosiao-other-info.model';
import {
  DynamicReportProjectQuestionModel,
  DYNAMIC_REPORT_PROJECT_QUESTION_BULLETIN_BOARD,
} from '../model/report-project-question-bulletin-board/report-project-question-bulletin-board.model';
import {
  CUSTOM_IMAGES_INDICATIVE_INFORMATION_COMPONENT,
  DynamicCustomImagesIndicativeInformationComponentModel,
} from '../model/custom-images-indicative-informaton-component/custom-images-indicative-informaton-component.model';
import {
  CUSTOM_IMAGES_IPILOT_LAMP_COMPONENT,
  DynamicCustomImagesIpilotLampComponentModel,
} from '../model/custom-images-ipilot-lamp-component/custom-images-ipilot-lamp-component.model';
import {
  CUSTOM_QUESTION_ROW_DETAIL_INFO_COMPONENT,
  DynamicCustomQuestionRowDetailInfoComponentModel,
} from '../model/custom-question-row-detail-info-component/custom-question-row-detail-info-component.model';
import {
  DYNAMIC_CUSTOM__ATHENA__C_U_S_T__P_C_C__P_R_O_J_E_C_T__C_H_A_N_G_E,
  DynamicCUSTPCCPROJECTCHANGEModel,
} from '../model/CUST_PCC_PROJECT_CHANGE/CUST_PCC_PROJECT_CHANGE.model';
import { setAppToken } from '@app-custom/ui/appToken';
import {
  DYNAMIC_CUSTOM_SHOW_PCC_PROJECT_PROCESS,
  DynamicViewProjectProgressModel,
} from '../model/view-project-progress/view-project-progress.model';
import {
  DYNAMIC_CUSTOM__ATHENA__U_C_MOMA__D_T_D__ASSIGNMENT_TASK_DETAIL_WAITTING,
  DynamicUCMomaDTDAssignmentTaskDetailWaittingModel,
} from '../model/UC_moma_DTD_Assignment-task-detail-waitting/UC_moma_DTD_Assignment-task-detail-waitting.model';
import {
  DYNAMIC_CUSTOM__ATHENA_PCC_PROBLEM_VIEW_HISTORY,
  DynamicPccProblemViewHistoryModel,
} from '../model/pcc_problem_view_history/pcc_problem_view_history.model';
import {
  DYNAMIC_CUSTOM__ATHENA_PCC_PROBLEM_VIEW_ATTACHMENT,
  DynamicPccProblemViewAttachmentModel,
} from '../model/pcc_problem_view_attachment/pcc_problem_view_attachment.model';
import {
  DYNAMIC_CUSTOM__ATHENA_PCC_COMMON_CUSTOM_ATTACHMENT,
  DynamicPccCommonCustomAttachmentModel,
} from '../model/pcc-common-custom-attachment/pcc-common-custom-attachment.model';
import {
  DYNAMIC_CUSTOM__ATHENA_PCC_PROJECT_INFO,
  DynamicPccProjectInfoModel,
} from '../model/pcc_project_info/pcc_project_info.model';

@Injectable()
export class DynamicBusinessFormModelConvertService implements DynamicFormModelConvertService {
  constructor(
    public customAppConfigService: CustomAppConfigService,
    private acI18n: AcI18nService,
    private languageService: DwLanguageService
  ) {}

  fromOneJSON(json: string | object, content: any): DynamicFormControlModel {
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
      case DYNAMIC_CUSTOM__ATHENA_PCC_PROJECT_INFO:
        result = new DynamicPccProjectInfoModel(model, layout);
        break;
      case DYNAMIC_CUSTOM__ATHENA_PCC_COMMON_CUSTOM_ATTACHMENT:
        result = new DynamicPccCommonCustomAttachmentModel(model, layout);
        break;
      case DYNAMIC_CUSTOM__ATHENA_PCC_PROBLEM_VIEW_ATTACHMENT:
        result = new DynamicPccProblemViewAttachmentModel(model, layout);
        break;
      case DYNAMIC_CUSTOM__ATHENA_PCC_PROBLEM_VIEW_HISTORY:
        result = new DynamicPccProblemViewHistoryModel(model, layout);
        break;
      case DYNAMIC_CUSTOM__ATHENA__U_C_MOMA__D_T_D__ASSIGNMENT_TASK_DETAIL_WAITTING:
        result = new DynamicUCMomaDTDAssignmentTaskDetailWaittingModel(model, layout);
        break;
      case DYNAMIC_CUSTOM__ATHENA__C_U_S_T__P_C_C__P_R_O_J_E_C_T__C_H_A_N_G_E:
        result = new DynamicCUSTPCCPROJECTCHANGEModel(model, layout);
        break;
      case DYNAMIC_CUSTOM__ATHENA_GAOSIAO_OTHER_INFO:
        result = new DynamicGaosiaoOtherInfoModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_TASK_TECHNICAL_SCHEME_DYNAMIC_ATTACHMENT:
        result = new PccDynamicDynamicAttachmentModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_PROBLEM_HANDLING:
      case DYNAMIC_CUSTOM_TASK_DataEntry_pccProjectQuestionList:
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_pcc_problem_handling:
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_task_0013_task_detail_waitting:
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_task_0014_task_detail:
        result = new DynamicPccProblemHandlingModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_RISK_MAINTENANCE_TABLE_OPERATE:
        result = new DynamicPccRiskMaintenanceTableOperateModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_RISK_MAINTENANCE_TABLE_ADD:
        result = new DynamicPccRiskMaintenanceTableAddModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DELIVERABLE:
        result = new DynamicProjectDeliverableModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_O_TASK_CARD:
        result = new DynamicApcOTaskCardModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_PCC_PROJECT_GANTT_CONDITION_DETAIL:
        result = new DynamicPccProjectGanttModel(model, layout);
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
      // 项目变更任务（wbs页面）
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK:
        result = new DynamicProjectChangeTaskModel(model, layout);
        break;
      // 项目变更任务（wbs页面）DTD
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_DTD:
        result = new DynamicProjectChangeTaskModel(model, layout);
        break;
      // 项目变更任务签核(项目周期异动)
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_ABNORMAL:
      // 项目变更任务签核（wbs页面）
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting:
        result = new DynamicProjectChangeTaskWaittingModel(model, layout);
        break;
      // 项目变更任务签核(项目周期异动)
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_ABNORMAL_DTD:
      // 项目变更任务签核（wbs页面）DTD
      case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_DTD:
        result = new DynamicProjectChangeTaskWaittingModel(model, layout);
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
      // 执行人报工
      case DYNAMIC_CUSTOM_PCC_SHOW_EXECUTOR_REPORTSWORK:
        result = new DynamicManualWorkReportingModel(model, layout);
        break;
      // 问题快反
      case DYNAMIC_CUSTOM_PCC_SHOW_PROBLEM_FEEDBACK:
        result = new QuestionQuickModel(model, layout);
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
      // 发起项目，定制【提交】按钮
      case DYNAMIC_CUSTOM_PCC_START_CUSTOM_COMPONENT:
        result = new CustomizedProjectSubmitModel(model, layout);
        break;
      case DYNAMIC_REPORT_PROJECT_QUESTION_BULLETIN_BOARD:
        result = new DynamicReportProjectQuestionModel(model, layout);
        break;
      case CUSTOM_IMAGES_INDICATIVE_INFORMATION_COMPONENT:
        result = new DynamicCustomImagesIndicativeInformationComponentModel(model, layout);
        break;
      case CUSTOM_IMAGES_IPILOT_LAMP_COMPONENT:
        result = new DynamicCustomImagesIpilotLampComponentModel(model, layout);
        break;
      case CUSTOM_QUESTION_ROW_DETAIL_INFO_COMPONENT:
        result = new DynamicCustomQuestionRowDetailInfoComponentModel(model, layout);
        break;
      case DYNAMIC_CUSTOM_SHOW_PCC_PROJECT_PROCESS:
        result = new DynamicViewProjectProgressModel(model, layout);
        break;
      default:
        break;
    }
    /** 渲染定制组件时，将应用信息传给service */
    if (!!result) {
      this.customAppConfigService.customConfig = CUSTOM_APP_CONFIG;
      setAppToken({
        ...CUSTOM_APP_CONFIG,
        sprint: 'I05',
      });
      // 应用组件库：添加设定代码
      const switchLanguage = { zh_TW, en_US, zh_CN };
      this.languageService.language$.subscribe((language): void => {
        this.acI18n.setLocale(switchLanguage[language] || zh_CN);
      });
    }
    return result;
  }
}
