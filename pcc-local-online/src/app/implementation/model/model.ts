import {
  DynamicFormValueControlModelConfig,
} from '@athena/dynamic-core';

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
  contents?: any;
  extendedFields: any;
  attach: any;
}
