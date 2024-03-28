import {
  DynamicFormValueControlModelConfig,
  DynamicFormValueControlModel,
  serializable,
  DynamicFormControlLayout,
} from '@athena/dynamic-core';
import { DefaultModelConfig, StateCode } from '../model';
// 基础资料
export const DYNAMIC_CUSTOM_TASK_DataEntry_pccProjectQuestionList =
  'DataEntry_pccProjectQuestionList-browse-page';
// 问题处理
export const DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_PROBLEM_HANDLING =
  'PCC_task_0012-task-detail-waitting';
// 问题验收
export const DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_task_0013_task_detail_waitting =
  'PCC_task_0013-task-detail-uibot__data__state__00000';
// 问题退回
export const DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_task_0014_task_detail =
  'PCC_task_0014-task-detail-waitting';
// 其他
export const DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_pcc_problem_handling =
  'pcc-problem-handling';

export class DynamicPccProblemHandlingModel extends DynamicFormValueControlModel<any> {
  @serializable() readonly type: string =
    DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_PROBLEM_HANDLING ||
    DYNAMIC_CUSTOM_TASK_DataEntry_pccProjectQuestionList ||
    DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_pcc_problem_handling ||
    DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_task_0013_task_detail_waitting ||
    DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_task_0014_task_detail;
  @serializable() stateCode?: StateCode;
  @serializable() actions?: any[];
  @serializable() operations?: any[];
  @serializable() finished?: boolean;
  @serializable() extendedFields: any;
  @serializable() attach: any;
  @serializable() useType: string;

  constructor(config: DefaultModelConfig, layout?: DynamicFormControlLayout) {
    super(config, layout);
    this.type = config?.type;
    this.stateCode = config?.stateCode;
    this.actions = config?.actions ?? [];
    this.operations = config?.operations ?? [];
    this.finished = config?.finished ?? false;
    this.extendedFields = config?.extendedFields ?? null;
    this.attach = config?.attach ?? null;
    this.useType = config?.useType ?? 'default';
  }
}
