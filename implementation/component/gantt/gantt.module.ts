import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared.module';
import { DynamicGanttComponent } from './gantt.component';
import { GanntService } from './gannt.service';


@NgModule({
  // providers: [
  //   GanntService
  // ],
  declarations: [
    DynamicGanttComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule
  ],
  exports: [
    DynamicGanttComponent
  ]
})
export class GanttModule { }
