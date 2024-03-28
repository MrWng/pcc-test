import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeReasonComponent } from './change-reason.component';
import { CustSharedModule } from '../../shared.module';



@NgModule({
  declarations: [
    ChangeReasonComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule
  ],
  exports: [
    ChangeReasonComponent
  ]
})
export class ChangeReasonModule { }
