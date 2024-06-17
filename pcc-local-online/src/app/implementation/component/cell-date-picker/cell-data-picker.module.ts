import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CellDatePickerComponent } from './cell-date-picker.component';
import { ChangeReasonModule } from '../change-reason/change-reason.module';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { AcTableModule } from '@app-custom/ui/ac-table';
import { AcAcTableCellModule } from '@app-custom/ui/ac-table-cell';
import { AcDatePickerModule } from '@app-custom/ui/date-picker';


@NgModule({
  declarations: [
    CellDatePickerComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule,
    ChangeReasonModule,
    AcTableModule,
    AcAcTableCellModule,
    AcDatePickerModule,
  ],
  exports: [
    CellDatePickerComponent
  ]
})
export class CellCheckBoxModule { }
