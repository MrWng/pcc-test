import { Injectable } from '@angular/core';
import { StandardWorkingHoursComponent } from '../individual-case/standard-working-hours-mc-pcc-input/standard-working-hours.component';
import { ProjPlanOtherInfoComponent } from '../individual-case/proj-plan-other-info/proj-plan-other-info.component';
import { DynamicCustomizedModel } from './dynamic-customized.model';
import { ReasonForLostOrderComponent } from '../individual-case/reason-for-lost-order/reason-for-lost-order.component';
import { TaskDetailIndividualCaseComponent } from '../individual-case/task-detail/task-detail.component';
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
      // 光斯奥指定结案丢单原因
      case '72007605-reason-for-lost-order':
      case '72007605_001-reason-for-lost-order':
      case 'uc_72007605-reason-for-lost-order':
      case 'uc72007605-reason-for-lost-order':
        component = new DynamicCustomizedModel(ReasonForLostOrderComponent, data);
        break;
      // 诚亿moma任务详情
      case 'uc72008898-task-detail':
      case 'uc72007605a-task-detail':
      case '72008898-task-detail':
      case '72008898_001-task-detail':
        component = new DynamicCustomizedModel(TaskDetailIndividualCaseComponent, data);
        break;
    }
    return component;
  }
  get isGaosiaoIndCase() {
    const curTenantId = JSON.parse(window.sessionStorage.getItem('DwUserInfo')).tenantId;
    const tenantIds = ['72007605', '72007605_001', 'uc_72007605', 'uc72007605'];
    return tenantIds.includes(curTenantId);
  }
  get isChengYiIndCase() {
    const curTenantId = JSON.parse(window.sessionStorage.getItem('DwUserInfo')).tenantId;
    const tenantIds = ['72008898', '72008898_001', 'uc72008898', 'uc72007605a'];
    return tenantIds.includes(curTenantId);
  }
}
