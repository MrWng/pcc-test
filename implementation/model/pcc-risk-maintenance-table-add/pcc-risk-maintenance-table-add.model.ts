import {
  DynamicFormValueControlModelConfig,
  DynamicFormValueControlModel,
  serializable,
  DynamicFormControlLayout,
} from '@athena/dynamic-core';
import { DefaultModelConfig, StateCode } from '../model';

export const DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_RISK_MAINTENANCE_TABLE_ADD =
  'pcc-risk-maintenance-table-add-project-detail';

export class DynamicPccRiskMaintenanceTableAddModel extends DynamicFormValueControlModel<any> {
  @serializable() readonly type: string =
    DYNAMIC_CUSTOM_TASK_PROJECT_CENTER_CONSOLE_PCC_RISK_MAINTENANCE_TABLE_ADD;
  @serializable() stateCode?: StateCode;
  @serializable() actions?: any[];
  @serializable() operations?: any[];
  @serializable() finished?: boolean;
  @serializable() extendedFields: any;
  @serializable() attach: any;
  @serializable() editable: any;

  constructor(config: DefaultModelConfig, layout?: DynamicFormControlLayout) {
    super(config, layout);
    this.type = config?.type;
    this.stateCode = config?.stateCode;
    this.actions = config?.actions ?? [];
    this.operations = config?.operations ?? [];
    this.finished = config?.finished ?? false;
    this.extendedFields = config?.extendedFields ?? null;
    this.attach = config?.attach ?? null;
    this.editable = config?.editable ?? true;
  }
}
