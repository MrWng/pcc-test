import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PccProblemHandlingComponent } from './pcc-problem-handling.component';
import { PccProblemHandlingService } from './pcc-problem-handling.service';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { SharedModule } from 'app/implementation/shared/shared.module';
import { MaintenanceInformationComponent } from './components/maintenance-information/maintenance-information.component';
import { MaintenanceInformationModule } from './components/maintenance-information/maintenanceInformation.module';
import { ProblemHandlingModule } from './components/problem-handling/problem-handling.module';
import { WbsTabsModule } from 'app/implementation/component/wbs-tabs/wbs-tabs.module';
@NgModule({
  declarations: [PccProblemHandlingComponent],
  imports: [
    CommonModule,
    SharedModule,
    CustSharedModule,
    ProblemHandlingModule,
    WbsTabsModule,
    MaintenanceInformationModule,
  ],
  exports: [PccProblemHandlingComponent],
})
export class PccProblemHandlingModule {}
