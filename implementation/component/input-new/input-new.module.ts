import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { inputNewComponent } from './input-new.component';
import { CustSharedModule } from '../../shared/cust-shared.module';



@NgModule({
  declarations: [
    inputNewComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule
  ],
  exports: [
    inputNewComponent
  ]
})
export class InputNewModule { }
