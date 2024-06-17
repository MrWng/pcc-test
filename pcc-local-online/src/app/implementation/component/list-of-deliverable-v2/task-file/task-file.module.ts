import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskFileComponent } from './task-file.component';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { AcTableModule } from '@app-custom/ui/ac-table';
import { AcAcTableCellModule } from '@app-custom/ui/ac-table-cell';
import { AthTableModule } from '@athena/design-ui/src/components/table';

@NgModule({
  imports: [CommonModule, CustSharedModule, AthTableModule, AcTableModule, AcAcTableCellModule],
  declarations: [TaskFileComponent],
})
export class TaskFileModule {}
