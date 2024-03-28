import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { InputGroupOpenWindowComponent } from './input-group-open-window.component';

@NgModule({
  declarations: [
    InputGroupOpenWindowComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule
  ],
  exports: [
    InputGroupOpenWindowComponent
  ]
})
export class InputGroupOpenWindowModule { }
