import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectPlanCardComponent } from './project-plan-card.component';
import { ChangeReasonModule } from '../change-reason/change-reason.module';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { CustWbsSharedModule } from 'app/implementation/shared/wbs-shared.module';
import { CancelCollaborationModule } from '../cancel-collaboration/cancel-collaboration.module';

@NgModule({
  declarations: [ProjectPlanCardComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    CustWbsSharedModule,
    ChangeReasonModule,
    CancelCollaborationModule,
  ],
  exports: [ProjectPlanCardComponent],
})
export class ProjectPlanCardModule {}
