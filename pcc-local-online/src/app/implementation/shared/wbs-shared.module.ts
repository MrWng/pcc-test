import { NgModule } from '@angular/core';
import { CustAuthBtnByShareDirective } from '../directive/wbs/btn-auth-share.directive';

const sharedModule = [];

@NgModule({
  declarations: [CustAuthBtnByShareDirective],
  imports: [...sharedModule],
  exports: [...sharedModule, CustAuthBtnByShareDirective],
})
export class CustWbsSharedModule {}
