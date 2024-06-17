import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectChangeFileComponent } from './project-change-file.component';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { AcTableModule } from '@app-custom/ui/ac-table';
import { AcAcTableCellModule } from '@app-custom/ui/ac-table-cell';

@NgModule({
  imports: [CommonModule, CustSharedModule, AcTableModule, AcAcTableCellModule],
  declarations: [ProjectChangeFileComponent],
})
export class ProjectChangeFileModule {}
