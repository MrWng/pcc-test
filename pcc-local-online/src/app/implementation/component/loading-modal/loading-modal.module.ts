import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { LoadingModalComponent } from './loading-modal.component';

@NgModule({
  declarations: [
    LoadingModalComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule
  ],
  exports: [
    LoadingModalComponent
  ]
})
export class LoadingModalModule { }