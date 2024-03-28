import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonInChargeComponent } from './person-in-charge.component';
import { ChangeReasonModule } from '../change-reason/change-reason.module';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { AcTableModule } from '@app-custom/ui/ac-table';
import { AcTreeSelectModule } from '@app-custom/ui/ac-tree-select';
import { AcAcTableCellModule } from '@app-custom/ui/ac-table-cell';


@NgModule({
  declarations: [
    PersonInChargeComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule,
    ChangeReasonModule,
    AcTableModule,
    AcTreeSelectModule,
    AcAcTableCellModule,
  ],
  exports: [
    PersonInChargeComponent
  ]
})
export class PersonInChargeModule { }
