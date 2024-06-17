import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProblemViewHistoryComponent } from './problem-view-history.component';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { IssueJourneyDetailsTableComponent } from '../issue-journey-details/issue-journey-details.component';

@NgModule({
  imports: [CommonModule, CustSharedModule],
  declarations: [ProblemViewHistoryComponent, IssueJourneyDetailsTableComponent],
  exports: [ProblemViewHistoryComponent],
})
export class ProblemViewHistoryModule {}
