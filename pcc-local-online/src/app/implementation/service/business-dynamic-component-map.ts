import { DynamicFormControl, DynamicFormControlModel } from '@athena/dynamic-core';
import { Type } from '@angular/core';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_ANALYSIS } from '../model/progress-analysis/progress-analysis.model';
import { ProgressAnalysisComponent } from '../programs/basic-data/progress-analysis/progress-analysis.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_INFO_MAINTAIN } from '../model/project-info-maintain/project-info-maintain.model';
import { ProjectInfoMaintainComponent } from '../programs/project-detail/project-info-maintain/project-info-maintain.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PROCESS_ROUTE } from '../model/project-process-route/project-process-route.model';
import { ProjectProcessRouteComponent } from '../programs/project-detail/project-process-route/project-process-route.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_SFT_TASK_CARD } from '../model/sft-task-card/sft-task-card.model';
import { SftTaskCardComponent } from '../programs/task-detail/sft-task-card/sft-task-card.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_FRONT_TASK } from '../model/front-task/front-task.model';
import { FrontTaskComponent } from '../programs/task-detail/front-task/front-task.component';
import { DYNAMIC_CUSTOM_PCC_SHOW_EXECUTOR_REPORTSWORK } from '../model/manual-work-reporting/manual-work-reporting.model';
import { DYNAMIC_CUSTOM_PCC_SHOW_PROBLEM_FEEDBACK } from '../model/question-quick/question-quick.model';
import { ManualWorkReportingComponent } from '../programs/task-detail/manual-work-reporting/manual-work-reporting.component';
import { QuestionQuickComponent } from '../programs/task-detail/question-quick/question-quick.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DETAIL } from '../model/project-detail/project-detail.model';
import { ProjectDetailComponent } from '../programs/task-detail/project-detail/project-detail.component';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE_DTD,
} from '../model/project-plan-manage/project-plan-manage.model';
import { ProjectPlanManageComponent } from '../programs/project-detail/project-plan-manage/project-plan-manage.component';
import {
  DYNAMIC_CUSTOM_PCC_MO_PROCESS_ASSIGNMENT,
  DYNAMIC_CUSTOM_PCC_MO_PROCESS_BPM_ASSIGNMENT,
  DYNAMIC_CUSTOM_PCC_PURCHASE_SUM_DTD_ASSIGNMENT_TASK_DETAIL_ALL,
  DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL,
  DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL_DTD,
  DYNAMIC_CUSTOM_PCC_TASK_DETAIL,
  DYNAMIC_CUSTOM_PCC_TASK_DETAIL_DTD,
  DYNAMIC_CUSTOM_PCC_MO_PROCESS_DTD_ASSIGNMENT_TASK_DETAIL_ALL,
} from '../model/posum-task-card/posum-task-card.model';
import { PosumTaskCardComponent } from '../programs/task-detail/posum-task-card/posum-task-card.component';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_TRACK,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROGRESS_TRACK_DTD,
} from '../model/progress-track/progress-track.model';
import { ProgressTrackComponent } from '../programs/project-detail/progress-track/progress-track.component';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_COOPERATION_TASK,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_COOPERATION_TASK_DTD,
} from '../model/cooperation-task/cooperation-task.model';
import { CooperationTaskComponent } from '../programs/task-detail/cooperation-task/cooperation-task.component';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_DTD,
} from '../model/project-change-task/project-change-task.model';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_DTD,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_ABNORMAL,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_ABNORMAL_DTD,
} from '../model/project-change-task-waitting/project-change-task-waitting.model';
import { ProjectChangeTaskComponent } from '../programs/task-detail/project-change-task/project-change-task.component';
import { ProjectChangeTaskWaittingComponent } from '../programs/task-detail/project-change-task-waitting/project-change-task-waitting.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_BASIC_DATA_TEMPLATE_MANAGE } from '../model/basic-data-template-manage/basic-data-template-manage.model';
import { BasicDataTemplateManageComponent } from '../programs/basic-data/basic-data-template-manage/basic-data-template-manage.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_TASK_CARD } from '../model/apc-task-card/apc-task-card.model';
import { ApcTaskCardComponent } from '../programs/task-detail/apc-task-card/apc-task-card.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_APC_O_TASK_CARD } from '../model/apc-o-task-card/apc-o-task-card.model';
import { ApcOTaskCardComponent } from '../programs/task-detail/apc-o-task-card/apc-o-task-card.component';
import { DYNAMIC_CUSTOM_PCC_PROJECT_GANTT_CONDITION_DETAIL } from '../model/pcc-project-gantt/pcc-project-gantt.model';
import { PccProjectGanttComponent } from '../programs/pcc-project-gantt/pcc-project-gantt.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_DELIVERABLE } from '../model/project-deliverable/project-deliverable.model';
import { ProjectDeliverableComponent } from '../programs/project-detail/project-deliverable/project-deliverable.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_RISK_MAINTENANCE_TABLE_ADD } from '../model/pcc-risk-maintenance-table-add/pcc-risk-maintenance-table-add.model';
import { PccRiskMaintenanceTableAddComponent } from '../programs/project-detail/pcc-risk-maintenance-table-add/pcc-risk-maintenance-table-add.component';
import { DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_RISK_MAINTENANCE_TABLE_OPERATE } from '../model/pcc-risk-maintenance-table-operate/pcc-risk-maintenance-table-operate.model';
import { PccRiskMaintenanceTableOperateComponent } from '../programs/project-detail/pcc-risk-maintenance-table-operate/pcc-risk-maintenance-table-operate.component';
import { DYNAMIC_CUSTOM_PCC_START_CUSTOM_COMPONENT } from '../model/customized-project-submit/customized-project-submit.model';
import { CustomizedProjectSubmitComponent } from '../programs/task-detail/customized-project-submit/customized-project-submit.component';
import {
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_PROBLEM_HANDLING,
  DYNAMIC_CUSTOM_TASK_DataEntry_pccProjectQuestionList,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_task_0013_task_detail_waitting,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_task_0014_task_detail,
  DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_pcc_problem_handling,
} from '../model/pcc-problem-handling/pcc-problem-handling.model';
import { PccProblemHandlingComponent } from '../programs/task-detail/pcc-problem-handling/pcc-problem-handling.component';
import { DYNAMIC_CUSTOM_TASK_TECHNICAL_SCHEME_DYNAMIC_ATTACHMENT } from '../model/pcc-attachment/dynamic-attachment.model';
import { PccDynamicAttachmentComponent } from '../programs/common/dynamic-attachment/dynamic-attachment.component';
import {
  DYNAMIC_CUSTOM__ATHENA_GAOSIAO_OTHER_INFO,
  DynamicGaosiaoOtherInfoModel,
} from '../model/gaosiao-other-info/gaosiao-other-info.model';
import { GaosiaoOtherInfoComponent } from '../programs/individual-case/gaosiao-other-info/gaosiao-other-info.component';
import { ReportProjectQuestionComponent } from '../programs/report-project-question-bulletin-board/report-project-question-bulletin-board.component';
import { DYNAMIC_REPORT_PROJECT_QUESTION_BULLETIN_BOARD } from '../model/report-project-question-bulletin-board/report-project-question-bulletin-board.model';
import {
  CUSTOM_IMAGES_INDICATIVE_INFORMATION_COMPONENT
} from '../model/custom-images-indicative-informaton-component/custom-images-indicative-informaton-component.model';
import {
  CustomImagesIndicativeInformatonComponent
} from '../programs/report-project-question-bulletin-board/custom-images-indicative-informaton-component/custom-images-indicative-informaton-component.component';
import {
  CUSTOM_IMAGES_IPILOT_LAMP_COMPONENT
} from '../model/custom-images-ipilot-lamp-component/custom-images-ipilot-lamp-component.model';
import {
  CustomImagesIpilotLampComponent
} from '../programs/report-project-question-bulletin-board/custom-images-ipilot-lamp-component/custom-images-ipilot-lamp-component.component';
import {
  CUSTOM_QUESTION_ROW_DETAIL_INFO_COMPONENT
} from '../model/custom-question-row-detail-info-component/custom-question-row-detail-info-component.model';
import {
  CustomQuestionRowDetailInfoComponent
} from '../programs/report-project-question-bulletin-board/custom-question-row-detail-info-component/custom-question-row-detail-info-component.component';
import { CUSTPCCPROJECTCHANGEComponent } from '../programs/task-detail/CUST_PCC_PROJECT_CHANGE/CUST_PCC_PROJECT_CHANGE.component';
import { DYNAMIC_CUSTOM__ATHENA__C_U_S_T__P_C_C__P_R_O_J_E_C_T__C_H_A_N_G_E, DynamicCUSTPCCPROJECTCHANGEModel } from '../model/CUST_PCC_PROJECT_CHANGE/CUST_PCC_PROJECT_CHANGE.model';
import { ViewProjectProgressComponent } from '../programs/task-detail/view-project-progress/view-project-progress.component';
import { DYNAMIC_CUSTOM_SHOW_PCC_PROJECT_PROCESS } from '../model/view-project-progress/view-project-progress.model';
import { UCMomaDTDAssignmentTaskDetailWaittingComponent } from '../programs/individual-case/UC_moma_DTD_Assignment-task-detail-waitting/UC_moma_DTD_Assignment-task-detail-waitting.component';
import { DYNAMIC_CUSTOM__ATHENA__U_C_MOMA__D_T_D__ASSIGNMENT_TASK_DETAIL_WAITTING, DynamicUCMomaDTDAssignmentTaskDetailWaittingModel } from '../model/UC_moma_DTD_Assignment-task-detail-waitting/UC_moma_DTD_Assignment-task-detail-waitting.model';
import { PccProblemViewHistoryComponent } from '../programs/task-detail/pcc_problem_view_history/pcc_problem_view_history.component';
import { DYNAMIC_CUSTOM__ATHENA_PCC_PROBLEM_VIEW_HISTORY, DynamicPccProblemViewHistoryModel } from '../model/pcc_problem_view_history/pcc_problem_view_history.model';
import { PccProblemViewAttachmentComponent } from '../programs/task-detail/pcc_problem_view_attachment/pcc_problem_view_attachment.component';
import { DYNAMIC_CUSTOM__ATHENA_PCC_PROBLEM_VIEW_ATTACHMENT, DynamicPccProblemViewAttachmentModel } from '../model/pcc_problem_view_attachment/pcc_problem_view_attachment.model';
import { PccCommonCustomAttachmentComponent } from '../programs/common/pcc-common-custom-attachment/pcc-common-custom-attachment.component';
import { DYNAMIC_CUSTOM__ATHENA_PCC_COMMON_CUSTOM_ATTACHMENT, DynamicPccCommonCustomAttachmentModel } from '../model/pcc-common-custom-attachment/pcc-common-custom-attachment.model';
import { PccProjectInfoComponent } from '../programs/task-detail/pcc_project_info/pcc_project_info.component';
import { DYNAMIC_CUSTOM__ATHENA_PCC_PROJECT_INFO, DynamicPccProjectInfoModel } from '../model/pcc_project_info/pcc_project_info.model';

export function businessUIFormComponentMapFn(
  model: DynamicFormControlModel
): Type<DynamicFormControl> | null {
  switch (model.type) {
    case DYNAMIC_CUSTOM__ATHENA_PCC_PROJECT_INFO:
      return PccProjectInfoComponent;
    case DYNAMIC_CUSTOM__ATHENA_PCC_COMMON_CUSTOM_ATTACHMENT:
      return PccCommonCustomAttachmentComponent;
    case DYNAMIC_CUSTOM__ATHENA_PCC_PROBLEM_VIEW_ATTACHMENT:
      return PccProblemViewAttachmentComponent;
    case DYNAMIC_CUSTOM__ATHENA_PCC_PROBLEM_VIEW_HISTORY:
      return PccProblemViewHistoryComponent;
    case DYNAMIC_CUSTOM__ATHENA__U_C_MOMA__D_T_D__ASSIGNMENT_TASK_DETAIL_WAITTING:
      return UCMomaDTDAssignmentTaskDetailWaittingComponent;
    case DYNAMIC_CUSTOM__ATHENA__C_U_S_T__P_C_C__P_R_O_J_E_C_T__C_H_A_N_G_E:
      return CUSTPCCPROJECTCHANGEComponent;
    case DYNAMIC_CUSTOM__ATHENA_GAOSIAO_OTHER_INFO:
      return GaosiaoOtherInfoComponent;
    // 查看附件
    case DYNAMIC_CUSTOM_TASK_TECHNICAL_SCHEME_DYNAMIC_ATTACHMENT:
      return PccDynamicAttachmentComponent;
    // 问题处理
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_PROBLEM_HANDLING:
    case DYNAMIC_CUSTOM_TASK_DataEntry_pccProjectQuestionList:
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_pcc_problem_handling:
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_task_0013_task_detail_waitting:
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_task_0014_task_detail:
      return PccProblemHandlingComponent;
    // 风险项表格操作栏
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_RISK_MAINTENANCE_TABLE_OPERATE:
      return PccRiskMaintenanceTableOperateComponent;
    // 风险项右上角新增按钮
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_RISK_MAINTENANCE_TABLE_ADD:
      return PccRiskMaintenanceTableAddComponent;
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
    // 项目变更任务（wbs页面）
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK:
      return ProjectChangeTaskComponent;
    // 项目变更任务（wbs页面）DTD
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_DTD:
      return ProjectChangeTaskComponent;
    // 项目变更任务签核(项目周期异动)
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_ABNORMAL:
    // 项目变更任务签核（wbs页面）
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting:
      return ProjectChangeTaskWaittingComponent;
    // 项目变更任务签核(项目周期异动)
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_ABNORMAL_DTD:
    // 项目变更任务签核（wbs页面）DTD
    case DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_DTD:
      return ProjectChangeTaskWaittingComponent;
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
    // 执行人报工
    case DYNAMIC_CUSTOM_PCC_SHOW_EXECUTOR_REPORTSWORK:
      return ManualWorkReportingComponent;
    // 问题快反
    case DYNAMIC_CUSTOM_PCC_SHOW_PROBLEM_FEEDBACK:
      return QuestionQuickComponent;
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
    // 报表 - 多项目甘特图
    case DYNAMIC_CUSTOM_PCC_PROJECT_GANTT_CONDITION_DETAIL:
      return PccProjectGanttComponent;
    // 发起项目，定制【提交】按钮
    case DYNAMIC_CUSTOM_PCC_START_CUSTOM_COMPONENT:
      return CustomizedProjectSubmitComponent;
    case DYNAMIC_REPORT_PROJECT_QUESTION_BULLETIN_BOARD:
      return ReportProjectQuestionComponent;
    case CUSTOM_IMAGES_INDICATIVE_INFORMATION_COMPONENT:
      return CustomImagesIndicativeInformatonComponent;
    case CUSTOM_IMAGES_IPILOT_LAMP_COMPONENT:
      return CustomImagesIpilotLampComponent;
    case CUSTOM_QUESTION_ROW_DETAIL_INFO_COMPONENT:
      return CustomQuestionRowDetailInfoComponent;
    case DYNAMIC_CUSTOM_SHOW_PCC_PROJECT_PROCESS:
      return ViewProjectProgressComponent;
    default:
      break;
  }
  return null;
}
