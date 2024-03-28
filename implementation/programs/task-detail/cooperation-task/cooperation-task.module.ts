import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { CooperationTaskComponent } from './cooperation-task.component';
import { DynamicTaskWbsListComponent } from './components/task-wbs-list/task-wbs-list.component';
import { AddSubprojectCardModule } from 'app/implementation/component/add-subproject-card/add-subproject-card.module';
import { HumanResourceLoadModule } from 'app/implementation/component/human-resource-load/human-resource-load.module';
import { ListOfDeliverableModule } from 'app/implementation/component/list-of-deliverable/list-of-deliverable.module';
import { ProjectPlanCardModule } from 'app/implementation/component/project-plan-card/project-plan-card.module';
import { ProjectTableModule } from '../../../component/project-table/project-table.module';

@NgModule({
  declarations: [CooperationTaskComponent, DynamicTaskWbsListComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    AddSubprojectCardModule,
    HumanResourceLoadModule,
    ListOfDeliverableModule,
    ProjectPlanCardModule,
    ProjectTableModule,
  ],
})
export class CooperationTaskModule {}
