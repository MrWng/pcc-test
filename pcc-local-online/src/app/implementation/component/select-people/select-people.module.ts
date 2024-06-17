import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { PccSelectPeopleComponent } from './select-people.component';

@NgModule({
  declarations: [PccSelectPeopleComponent],
  imports: [CommonModule, CustSharedModule],
  exports: [PccSelectPeopleComponent],
})
export class PccSelectPeopleModule {}
