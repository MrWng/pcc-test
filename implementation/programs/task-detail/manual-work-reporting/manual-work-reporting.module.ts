import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { ManualWorkReportingComponent } from './manual-work-reporting.component';

@NgModule({
  declarations: [ManualWorkReportingComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
})
export class ManualWorkReportingModule {}
