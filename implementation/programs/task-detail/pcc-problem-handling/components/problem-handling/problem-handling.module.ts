import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProblemHandlingComponent } from './problem-handling.component';
import { HandlingMattersTableComponent } from './components/handling-matters-table/handling-matters-table.component';
import { BaseInfoFormComponent } from './components/base-info-form/base-info-form.component';
import { ProblemHandlingService } from './problem-handling.service';
import { IssueJourneyDetailsTableComponent } from './components/issue-journey-details/issue-journey-details.component';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { AthModalModule } from '@athena/design-ui';
import { MaintenanceInformationModule } from '../maintenance-information/maintenanceInformation.module';
import { PccSubmitBtnModule } from 'app/implementation/component/submit-btn/submit-btn.module';
@NgModule({
  declarations: [
    ProblemHandlingComponent,
    HandlingMattersTableComponent,
    BaseInfoFormComponent,
    IssueJourneyDetailsTableComponent,
  ],
  imports: [CommonModule, CustSharedModule, MaintenanceInformationModule, PccSubmitBtnModule],
  exports: [ProblemHandlingComponent],
})
export class ProblemHandlingModule {}
