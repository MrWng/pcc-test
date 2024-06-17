import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { PccProblemViewAttachmentComponent } from './pcc_problem_view_attachment.component';
import { ProblemViewAttachmentModule } from '../pcc-problem-handling/components/problem-handling/components/problem-view-attachment/problem-view-attachment.module';

@NgModule({
  declarations: [PccProblemViewAttachmentComponent],
  imports: [CommonModule, CustSharedModule, ProblemViewAttachmentModule],
})
export class PccProblemViewAttachmentModule {}
