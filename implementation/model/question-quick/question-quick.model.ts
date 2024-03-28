import { DynamicFormValueControlModel, serializable, DynamicFormControlLayout } from '@athena/dynamic-core';
import { DefaultModelConfig, StateCode } from '../model';

export const DYNAMIC_CUSTOM_PCC_SHOW_PROBLEM_FEEDBACK = 'showProblemFeedback';

export class QuestionQuickModel extends DynamicFormValueControlModel<any> {
  @serializable() readonly type: string = DYNAMIC_CUSTOM_PCC_SHOW_PROBLEM_FEEDBACK;
  @serializable() stateCode?: StateCode;
  @serializable() actions?: any[];
  @serializable() operations?: any[];
  @serializable() finished?: boolean;
  @serializable() extendedFields: any;
  @serializable() attach: any;
  @serializable() contents: any;

  constructor(config: DefaultModelConfig, layout?: DynamicFormControlLayout) {
    super(config, layout);
    this.type = config?.type;
    this.stateCode = config?.stateCode;
    this.actions = config?.actions ?? [];
    this.operations = config?.operations ?? [];
    this.finished = config?.finished ?? false;
    this.extendedFields = config?.extendedFields ?? null;
    this.attach = config?.attach ?? null;
    this.contents = config?.contents ?? null;
  }
}
