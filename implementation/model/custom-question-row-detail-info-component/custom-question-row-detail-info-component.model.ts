import {
  DynamicFormValueControlModelConfig,
  DynamicFormValueControlModel,
  serializable,
  DynamicFormControlLayout,
} from '@athena/dynamic-core';
import { DefaultModelConfig, StateCode } from '../model';

export const CUSTOM_QUESTION_ROW_DETAIL_INFO_COMPONENT = 'question_row_detail_info';

export class DynamicCustomQuestionRowDetailInfoComponentModel extends DynamicFormValueControlModel<any> {
  @serializable() readonly type: string = CUSTOM_QUESTION_ROW_DETAIL_INFO_COMPONENT;
  @serializable() stateCode?: StateCode;
  @serializable() actions?: any[];
  @serializable() operations?: any[];
  @serializable() finished?: boolean;
  @serializable() extendedFields: any;
  @serializable() attach: any;
  @serializable() parentModel: any;
  @serializable() useType?: any;
  @serializable() pageReadonly?: any;
  @serializable() pageType?: any;

  constructor(config: DefaultModelConfig, layout?: DynamicFormControlLayout) {
    super(config, layout);
    this.type = config?.type;
    this.stateCode = config?.stateCode;
    this.actions = config?.actions ?? [];
    this.operations = config?.operations ?? [];
    this.finished = config?.finished ?? false;
    this.extendedFields = config?.extendedFields ?? null;
    this.attach = config?.attach ?? null;
    this.parentModel = config?.parentModel ?? null;
    this.useType = config?.useType ?? null;
    this.pageReadonly = config?.pageReadonly ?? null;
    this.pageType = config?.pageType ?? null;
  }
}
