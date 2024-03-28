import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectPlanCardComponent } from './project-plan-card.component';
import { ChangeReasonModule } from '../change-reason/change-reason.module';
import { CustSharedModule } from '../../shared.module';


@NgModule({
  declarations: [
    ProjectPlanCardComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule,
    ChangeReasonModule
  ],
  exports: [
    ProjectPlanCardComponent
  ]
})
export class ProjectPlanCardModule { }
