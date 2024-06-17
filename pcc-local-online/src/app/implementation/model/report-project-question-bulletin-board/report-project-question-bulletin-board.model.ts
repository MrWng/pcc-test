import { DynamicFormValueControlModel, serializable, DynamicFormControlLayout } from '@athena/dynamic-core';
import { DefaultModelConfig, StateCode } from '../model';

export const DYNAMIC_REPORT_PROJECT_QUESTION_BULLETIN_BOARD = 'Report_project_question_bulletin_board-condition-detail';

export class DynamicReportProjectQuestionModel extends DynamicFormValueControlModel<any> {
  @serializable() readonly type: string = DYNAMIC_REPORT_PROJECT_QUESTION_BULLETIN_BOARD;
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
