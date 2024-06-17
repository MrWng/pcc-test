import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { PccCommonCustomAttachmentComponent } from './pcc-common-custom-attachment.component';

@NgModule({
  declarations: [ PccCommonCustomAttachmentComponent ],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
})
export class PccCommonCustomAttachmentModule {}
