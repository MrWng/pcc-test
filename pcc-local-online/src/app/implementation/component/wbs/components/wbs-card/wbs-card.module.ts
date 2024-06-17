import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WbsCardComponent } from './wbs-card.component';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { CardHeadComponent } from './components/card-head/card-head.component';
import { CardOperationComponent } from './components/card-operation/card-operation.component';
import { CustWbsSharedModule } from 'app/implementation/shared/wbs-shared.module';
import { CardBodyComponent } from './components/card-body/card-body.component';
import { CancelCollaborationModule } from 'app/implementation/component/cancel-collaboration/cancel-collaboration.module';
import { CardPersonDisplayDirective } from './wbs-card-person.directive';
// eslint-disable-next-line max-len
import { TaskWbsListService } from 'app/implementation/programs/task-detail/cooperation-task/components/task-wbs-list/task-wbs-list.service';
import { ProjectPlanCardV2Service } from 'app/implementation/component/project-plan-card-v2/project-plan-card.service';
import { CardFootComponent } from './components/card-foot/card-foot.component';
import { CardProcessComponent } from './components/card-process/card-process.component';
import { CardOverdueTagComponent } from './components/card-overdue-tag/card-overdue-tag.component';
import { CardWorkDateComponent } from './components/card-work-date/card-work-date.component';
import { CardBaseInfoComponent } from './components/card-base-info/card-base-info.component';
import { CardStatusComponent } from './components/card-status/card-status.component';
import { WbsCardService } from './wbs-card.service';

@NgModule({
  imports: [CommonModule, CustSharedModule, CustWbsSharedModule, CancelCollaborationModule],
  declarations: [
    WbsCardComponent,
    CardHeadComponent,
    CardBodyComponent,
    CardFootComponent,
    CardOperationComponent,
    CardProcessComponent,
    CardOverdueTagComponent,
    CardStatusComponent,
    CardWorkDateComponent,
    CardBaseInfoComponent,
    CardPersonDisplayDirective,
  ],
  providers: [TaskWbsListService, ProjectPlanCardV2Service, WbsCardService],
  exports: [WbsCardComponent],
})
export class WbsCardModule {}
