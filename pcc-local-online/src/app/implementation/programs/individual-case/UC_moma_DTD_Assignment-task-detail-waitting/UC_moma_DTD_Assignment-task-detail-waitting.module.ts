import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { UCMomaDTDAssignmentTaskDetailWaittingComponent } from './UC_moma_DTD_Assignment-task-detail-waitting.component';
import { TaskDetailIndividualCaseModule } from 'app/implementation/individual-case/task-detail/task-detail.module';

@NgModule({
  declarations: [UCMomaDTDAssignmentTaskDetailWaittingComponent],
  imports: [CommonModule, CustSharedModule, TaskDetailIndividualCaseModule],
})
export class UCMomaDTDAssignmentTaskDetailWaittingModule {}
