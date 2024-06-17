import {
  DynamicFormValueControlModelConfig,
  DynamicFormValueControlModel,
  serializable,
  DynamicFormControlLayout,
} from '@athena/dynamic-core';
import { DefaultModelConfig, StateCode } from '../model';

export const DYNAMIC_CUSTOM__ATHENA__C_U_S_T__P_C_C__P_R_O_J_E_C_T__C_H_A_N_G_E = 'CUST_PCC_PROJECT_CHANGE';

export class DynamicCUSTPCCPROJECTCHANGEModel extends DynamicFormValueControlModel<any> {
  @serializable() readonly type: string = DYNAMIC_CUSTOM__ATHENA__C_U_S_T__P_C_C__P_R_O_J_E_C_T__C_H_A_N_G_E;
  @serializable() stateCode?: StateCode;
  @serializable() actions?: any[];
  @serializable() operations?: any[];
  @serializable() finished?: boolean;
  @serializable() extendedFields: any;
  @serializable() attach: any;
  @serializable() config: any;

  constructor(config: DefaultModelConfig, layout?: DynamicFormControlLayout) {
    super(config, layout);
    this.type = config?.type;
    this.stateCode = config?.stateCode;
    this.actions = config?.actions ?? [];
    this.operations = config?.operations ?? [];
    this.finished = config?.finished ?? false;
    this.extendedFields = config?.extendedFields ?? null;
    this.attach = config?.attach ?? null;
    this.config = config;
  }
}
