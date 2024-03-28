import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { PccRiskMaintenanceTableOperateComponent } from './pcc-risk-maintenance-table-operate.component';

@NgModule({
  declarations: [PccRiskMaintenanceTableOperateComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
})
export class PccRiskMaintenanceTableOperateModule {}
