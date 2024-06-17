import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkloadQtyComponent } from './workload-qty.component';
import { ChangeReasonModule } from '../change-reason/change-reason.module';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { AcTableModule } from '@app-custom/ui/ac-table';
import { AcAcTableCellModule } from '@app-custom/ui/ac-table-cell';


@NgModule({
  declarations: [
    WorkloadQtyComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule,
    ChangeReasonModule,
    AcTableModule,
    AcAcTableCellModule,
  ],
  exports: [
    WorkloadQtyComponent
  ]
})
export class WorkloadQtyModule { }
