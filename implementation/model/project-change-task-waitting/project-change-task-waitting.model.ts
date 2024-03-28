import {
  DynamicFormValueControlModelConfig,
  DynamicFormValueControlModel,
  serializable,
  DynamicFormControlLayout,
} from '@athena/dynamic-core';
import { DefaultModelConfig, StateCode } from '../model';

export const DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting = 'PCC_task_0010-task-detail-waitting';
export const DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_DTD = 'PCC_task_0010-task-detail-waitting';

export const DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_ABNORMAL = 'PCC_task_0016-task-detail-waitting';
export const DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_CHANGE_TASK_Waitting_ABNORMAL_DTD = 'PCC_task_0016-task-detail-waitting';

export class DynamicProjectChangeTaskWaittingModel extends DynamicFormValueControlModel<any> {
  @serializable() readonly type: string;
  @serializable() stateCode?: StateCode;
  @serializable() actions?: any[];
  @serializable() operations?: any[];
  @serializable() finished?: boolean;
  @serializable() extendedFields: any;
  @serializable() attach: any;

  constructor(config: DefaultModelConfig, layout?: DynamicFormControlLayout) {
    super(config, layout);
    this.type = config?.type;
    this.stateCode = config?.stateCode;
    this.actions = config?.actions ?? [];
    this.operations = config?.operations ?? [];
    this.finished = config?.finished ?? false;
    this.extendedFields = config?.extendedFields ?? null;
    this.attach = config?.attach ?? null;
  }
}
