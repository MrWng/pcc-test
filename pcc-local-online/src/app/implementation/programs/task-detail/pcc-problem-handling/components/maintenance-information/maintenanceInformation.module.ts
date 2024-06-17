import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { MaintenanceInformationComponent } from './maintenance-information.component';
import { PccSelectPeopleModule } from 'app/implementation/component/select-people/select-people.module';

@NgModule({
  declarations: [MaintenanceInformationComponent],
  imports: [CommonModule, CustSharedModule, PccSelectPeopleModule],
  exports: [MaintenanceInformationComponent],
})
export class MaintenanceInformationModule {}
