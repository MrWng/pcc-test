import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { CooperationTaskComponent } from './cooperation-task.component';
import { DynamicTaskWbsListComponent } from './components/task-wbs-list/task-wbs-list.component';
import { AddSubprojectCardModule } from 'app/implementation/component/add-subproject-card/add-subproject-card.module';
import { HumanResourceLoadModule } from 'app/implementation/component/human-resource-load/human-resource-load.module';
import { ListOfDeliverableModule } from 'app/implementation/component/list-of-deliverable/list-of-deliverable.module';
import { ProjectPlanCardModule } from 'app/implementation/component/project-plan-card/project-plan-card.module';
import { ProjectPlanCardV2Module } from 'app/implementation/component/project-plan-card-v2/project-plan-card.module';
import { ProjectTableModule } from '../../../component/project-table/project-table.module';
import { ListOfDeliverableV2Module } from 'app/implementation/component/list-of-deliverable-v2/list-of-deliverable.module';
import { CancelCollaborationModule } from 'app/implementation/component/cancel-collaboration/cancel-collaboration.module';
import { LoadingModalModule } from 'app/implementation/component/loading-modal/loading-modal.module';
import { AcOperationButtonSaveModule } from '@app-custom/ui/operation-button-save';

@NgModule({
  declarations: [CooperationTaskComponent, DynamicTaskWbsListComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    AddSubprojectCardModule,
    HumanResourceLoadModule,
    ListOfDeliverableModule,
    ListOfDeliverableV2Module,
    ProjectPlanCardModule,
    ProjectPlanCardV2Module,
    ProjectTableModule,
    CancelCollaborationModule,
    LoadingModalModule,
    AcOperationButtonSaveModule,
  ],
})
export class CooperationTaskModule {}
