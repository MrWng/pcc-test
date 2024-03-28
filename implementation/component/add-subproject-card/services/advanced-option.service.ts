import { Injectable } from '@angular/core';

@Injectable()
export class AdvancedOptionService {
  /** 主单位是否校验通过 */
  planMainUnitValue: boolean = false;
  /** 次单位是否校验通过 */
  planSecondUnitValue: boolean = false;

  constructor() { }
}
