import {
  DynamicFormValueControlModelConfig,
} from '@ng-dynamic-forms/core';

// eslint-disable-next-line no-shadow
export enum StateCode {
  waiting = 'waiting',
  completed = 'completed',
}

export interface DefaultModelConfig extends DynamicFormValueControlModelConfig<string | number> {
  type: string;
  stateCode?: StateCode;
  actions?: any[];
  operations?: any[];
  finished?: boolean;
  extendedFields: any;
  attach: any;
}
