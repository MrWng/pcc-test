import {
  DynamicFormValueControlModelConfig,
  DynamicFormValueControlModel,
  serializable,
  DynamicFormControlLayout,
} from '@athena/dynamic-core';
import { DefaultModelConfig, StateCode } from '../model';

export const DYNAMIC_CUSTOM_PCC_TASK_DETAIL = 'purchaseRequestSumAssignment-task-detail-all';
export const DYNAMIC_CUSTOM_PCC_MO_PROCESS_DTD_ASSIGNMENT_TASK_DETAIL_ALL = 'moProcess_DTD_Assignment-task-detail-waitting';
export const DYNAMIC_CUSTOM_PCC_MO_PROCESS_BPM_ASSIGNMENT = 'moProcessAssignment';
export const DYNAMIC_CUSTOM_PCC_TASK_DETAIL_DTD = 'purchaseRequestSum_DTD_Assignment-task-detail-all';
export const DYNAMIC_CUSTOM_PCC_PURCHASE_SUM_DTD_ASSIGNMENT_TASK_DETAIL_ALL = 'purchaseSum_DTD_Assignment-task-detail-all';
export const DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL = 'purchaseSumAssignment-task-detail-all';
export const DYNAMIC_CUSTOM_PCC_TASKPRSUM_DETAIL_DTD = 'purchaseRequestSum_DTD_Assignment-task-detail-all';
export const DYNAMIC_CUSTOM_PCC_MO_PROCESS_ASSIGNMENT = 'moProcessAssignment-task-detail-all';

export class DynamicPosumTaskCardModel extends DynamicFormValueControlModel<any> {
  @serializable() readonly type: string;
  @serializable() stateCode?: StateCode;
  @serializable() actions?: any[];
  @serializable() operations?: any[];
  @serializable() finished?: boolean;
  @serializable() extendedFields: any;
  @serializable() attach: any;
  @serializable() is_need_doc_no: string = '';

  constructor(config: DefaultModelConfig, layout?: DynamicFormControlLayout) {
    super(config, layout);
    Object.assign(this, config);
  }
}
