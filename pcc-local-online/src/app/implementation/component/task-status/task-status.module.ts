import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskStatusComponent } from './task-status.component';
import { ChangeReasonModule } from '../change-reason/change-reason.module';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { AcTableModule } from '@app-custom/ui/ac-table';


@NgModule({
  declarations: [
    TaskStatusComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule,
    ChangeReasonModule,
    AcTableModule,
  ],
  exports: [
    TaskStatusComponent
  ]
})
export class TaskStatusModule { }
