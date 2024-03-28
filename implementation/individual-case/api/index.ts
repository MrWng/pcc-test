import { Injectable } from '@angular/core';
import { CommonService } from 'app/implementation/service/common.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IndividualCaseAPIService {
  constructor(protected commonService: CommonService) {}

  /**
   * uc.project.reason.for.lost.order.info.update
   * 光斯奥丢单原因
   */
  UC_PROJECT_REASON_FOR_LOST_ORDER_INFO_UPDATE(params) {
    return this.commonService
      .getInvData('uc.project.reason.for.lost.order.info.update', {
        lost_order_info: params,
      })
      .toPromise();
  }
  /**
   * uc.project.business.opportunity.new.info.delete
   * 光斯奥项目删除
   */
  UC_PROJECT_BUSINESS_OPPORTUNITY_INFO_DELETE(params) {
    return this.commonService
      .getInvData('uc.project.business.opportunity.new.info.delete', {
        business_info: params,
      })
      .toPromise();
  }
}
