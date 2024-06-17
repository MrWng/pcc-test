import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CellCheckBoxComponent } from './cell-checkBox.component';
import { ChangeReasonModule } from '../change-reason/change-reason.module';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { AcTableModule } from '@app-custom/ui/ac-table';
import { AcAcTableCellModule } from '@app-custom/ui/ac-table-cell';


@NgModule({
  declarations: [
    CellCheckBoxComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule,
    ChangeReasonModule,
    AcTableModule,
    AcAcTableCellModule,
  ],
  exports: [
    CellCheckBoxComponent
  ]
})
export class CellCheckBoxModule { }
