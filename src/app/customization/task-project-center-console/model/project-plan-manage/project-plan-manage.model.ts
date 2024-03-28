import {
  DynamicFormValueControlModelConfig,
  DynamicFormValueControlModel,
  serializable,
  DynamicFormControlLayout,
} from '@ng-dynamic-forms/core';
import { DefaultModelConfig, StateCode } from '../model';

export const DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE = 'maintenanceProject-project-detail';

/** 这里比较特殊，两个定制页用的同一个组件，组件内部根据type的不同处理不同的逻辑 */
export const DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PROJECT_PLAN_MANAGE_DTD = 'maintenanceProject_DTD-project-detail';

export class DynamicProjectPlanManageModel extends DynamicFormValueControlModel<any> {
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
