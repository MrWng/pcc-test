import { Type } from '@angular/core';

export class DynamicCustomizedModel {
  constructor(public component: Type<any>, public data: any) {}
}
