import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompletionStatusComponent } from './completion-status.component';
import { AcAcTableCellModule } from '@app-custom/ui/ac-table-cell';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';

@NgModule({
  imports: [CommonModule, CustSharedModule, AcAcTableCellModule],
  declarations: [CompletionStatusComponent],
})
export class CompletionStatusModule {}
