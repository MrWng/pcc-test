import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcTableModule } from '@app-custom/ui/ac-table';
import { AcAcTableCellModule } from '@app-custom/ui/ac-table-cell';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { ProjectFileComponent } from './project-file.component';

@NgModule({
  imports: [CommonModule, CustSharedModule, AcTableModule, AcAcTableCellModule],
  declarations: [ProjectFileComponent],
})
export class ProjectFileModule {}
