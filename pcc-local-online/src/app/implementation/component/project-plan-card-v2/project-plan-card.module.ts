import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeReasonModule } from '../change-reason/change-reason.module';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { CustWbsSharedModule } from 'app/implementation/shared/wbs-shared.module';
import { CancelCollaborationModule } from '../cancel-collaboration/cancel-collaboration.module';
import { ProjectPlanCardV2Component } from './project-plan-card.component';
import { AthMessageService } from '@athena/design-ui';
import { WbsCardModule } from '../wbs/components/wbs-card/wbs-card.module';

@NgModule({
  declarations: [ProjectPlanCardV2Component],
  providers: [AthMessageService],
  imports: [
    CommonModule,
    CustSharedModule,
    CustWbsSharedModule,
    ChangeReasonModule,
    CancelCollaborationModule,
    WbsCardModule,
  ],
  exports: [ProjectPlanCardV2Component],
})
export class ProjectPlanCardV2Module {}
