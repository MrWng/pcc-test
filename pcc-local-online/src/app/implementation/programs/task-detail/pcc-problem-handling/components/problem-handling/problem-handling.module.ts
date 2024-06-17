import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProblemHandlingComponent } from './problem-handling.component';
import { HandlingMattersTableComponent } from './components/handling-matters-table/handling-matters-table.component';
import { BaseInfoFormComponent } from './components/base-info-form/base-info-form.component';
import { ProblemHandlingService } from './problem-handling.service';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { AthModalModule } from '@athena/design-ui';
import { MaintenanceInformationModule } from '../maintenance-information/maintenanceInformation.module';
import { PccSubmitBtnModule } from 'app/implementation/component/submit-btn/submit-btn.module';
import { ProblemViewAttachmentComponent } from './components/problem-view-attachment/problem-view-attachment.component';
import { ProblemViewHistoryModule } from './components/problem-view-history/problem-view-history.module';
import { ProblemViewAttachmentModule } from './components/problem-view-attachment/problem-view-attachment.module';
@NgModule({
  declarations: [ProblemHandlingComponent, HandlingMattersTableComponent, BaseInfoFormComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    MaintenanceInformationModule,
    PccSubmitBtnModule,
    ProblemViewHistoryModule,
    ProblemViewAttachmentModule,
  ],
  exports: [ProblemHandlingComponent],
})
export class ProblemHandlingModule {}
