import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { PccProjectGanttComponent } from './pcc-project-gantt.component';

@NgModule({
  declarations: [PccProjectGanttComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
})
export class PccProjectGanttModule {}
