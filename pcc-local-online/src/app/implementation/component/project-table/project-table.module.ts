import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectTableComponent } from './project-table.component';
import { ChangeReasonModule } from '../change-reason/change-reason.module';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { AcTableModule } from '@app-custom/ui/ac-table';
import { PersonInChargeModule } from '../person-in-charge/person-in-charge.module';

@NgModule({
  declarations: [ProjectTableComponent],
  imports: [CommonModule, CustSharedModule, ChangeReasonModule, AcTableModule],
  exports: [ProjectTableComponent],
})
export class ProjectTableModule {}
