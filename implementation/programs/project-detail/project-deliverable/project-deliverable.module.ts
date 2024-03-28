import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { ProjectDeliverableComponent } from './project-deliverable.component';

@NgModule({
  declarations: [ProjectDeliverableComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
  exports: [
    ProjectDeliverableComponent
  ]
})
export class ProjectDeliverableModule { }
