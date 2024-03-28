import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { PccSubmitBtnComponent } from './submit-btn.component';
import { PccSelectPeopleModule } from '../select-people/select-people.module';

@NgModule({
  declarations: [PccSubmitBtnComponent],
  imports: [CommonModule, CustSharedModule, PccSelectPeopleModule],
  exports: [PccSubmitBtnComponent],
})
export class PccSubmitBtnModule {}
