import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared.module';
import { CooperationTaskComponent } from './cooperation-task.component';
import { DynamicTaskWbsListComponent } from './components/task-wbs-list/task-wbs-list.component';
import { AddSubprojectCardModule } from 'app/customization/task-project-center-console/component/add-subproject-card/add-subproject-card.module';
import { HumanResourceLoadModule } from 'app/customization/task-project-center-console/component/human-resource-load/human-resource-load.module';
import { ListOfDeliverableModule } from 'app/customization/task-project-center-console/component/list-of-deliverable/list-of-deliverable.module';
import { ProjectPlanCardModule } from 'app/customization/task-project-center-console/component/project-plan-card/project-plan-card.module';

@NgModule({
  declarations: [CooperationTaskComponent, DynamicTaskWbsListComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    AddSubprojectCardModule,
    HumanResourceLoadModule,
    ListOfDeliverableModule,
    ProjectPlanCardModule
  ],
})
export class CooperationTaskModule {}
