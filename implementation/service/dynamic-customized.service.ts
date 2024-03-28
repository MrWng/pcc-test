import { Injectable } from '@angular/core';
import { StandardWorkingHoursComponent } from '../individual-case/standard-working-hours-mc-pcc-input/standard-working-hours.component';
import { ProjPlanOtherInfoComponent } from '../individual-case/proj-plan-other-info/proj-plan-other-info.component';
import { DynamicCustomizedModel } from './dynamic-customized.model';
// eslint-disable-next-line max-len
@Injectable({
  providedIn: 'root',
})
export class DynamicCustomizedService {
  getComponent(data: any) {
    let component;
    switch (data.tenantIdComponent) {
      // 乾冶标准工时标准天数
      case '72007522-standard-working-hours':
      case '72007522_001-standard-working-hours':
        component = new DynamicCustomizedModel(StandardWorkingHoursComponent, data);
        break;
      // 光斯奥项目计划维护其他信息
      case '72007605-proj-plan-other-info':
      case '72007605_001-proj-plan-other-info':
      case 'uc_72007605-proj-plan-other-info':
      case 'uc72007605-proj-plan-other-info':
        component = new DynamicCustomizedModel(ProjPlanOtherInfoComponent, data);
        break;
    }
    return component;
  }
}
