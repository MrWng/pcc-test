import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { PccProblemViewHistoryComponent } from './pcc_problem_view_history.component';
import { ProblemViewHistoryModule } from '../pcc-problem-handling/components/problem-handling/components/problem-view-history/problem-view-history.module';

@NgModule({
  declarations: [PccProblemViewHistoryComponent],
  imports: [CommonModule, CustSharedModule, ProblemViewHistoryModule],
})
export class PccProblemViewHistoryModule {}
