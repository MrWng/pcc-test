import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../../shared/cust-shared.module';
import { PccRiskMaintenanceComponent } from './risk-maintenance.component';
import { PccRiskDetailMaintenanceComponent } from './component/maintenance.component';
@NgModule({
  declarations: [PccRiskMaintenanceComponent, PccRiskDetailMaintenanceComponent],
  imports: [CommonModule, CustSharedModule],
  exports: [PccRiskMaintenanceComponent, PccRiskDetailMaintenanceComponent],
})
export class PccRiskMaintenanceModule {}
