import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { CUSTPCCPROJECTCHANGEComponent } from './CUST_PCC_PROJECT_CHANGE.component';

@NgModule({
  declarations: [ CUSTPCCPROJECTCHANGEComponent ],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
})
export class CUSTPCCPROJECTCHANGEModule {}
