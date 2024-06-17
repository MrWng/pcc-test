import {
  serializable,
  DynamicFormControlLayout,
  DynamicFormUploadModel,
  DynamicFormUploadModelConfig,
} from '@athena/dynamic-core';
import { StateCode } from '../model';

export const DYNAMIC_CUSTOM_TASK_TECHNICAL_SCHEME_DYNAMIC_ATTACHMENT = 'PCC-ATTACHMENT';

export class PccDynamicDynamicAttachmentModel extends DynamicFormUploadModel {
  @serializable() readonly type: string = DYNAMIC_CUSTOM_TASK_TECHNICAL_SCHEME_DYNAMIC_ATTACHMENT;
  @serializable() stateCode?: StateCode;
  @serializable() actions?: any[];
  @serializable() operations?: any[];
  @serializable() finished?: boolean;
  @serializable() extendedFields: any;
  @serializable() attach: any;

  constructor(config: DynamicFormUploadModelConfig, layout?: DynamicFormControlLayout) {
    super(config, layout);
  }
}
