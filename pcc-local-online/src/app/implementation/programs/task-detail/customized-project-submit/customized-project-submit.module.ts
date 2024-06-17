import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { CustomizedProjectSubmitComponent } from './customized-project-submit.component';

@NgModule({
  declarations: [CustomizedProjectSubmitComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
})
export class CustomizedProjectSubmitModule {}
