import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { PccRiskMaintenanceTableAddComponent } from './pcc-risk-maintenance-table-add.component';

@NgModule({
  declarations: [PccRiskMaintenanceTableAddComponent],
  imports: [CommonModule, CustSharedModule],
})
export class PccRiskMaintenanceTableAddModule {}
