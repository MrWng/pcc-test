import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PccDynamicAttachmentComponent } from './dynamic-attachment.component';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';

@NgModule({
  declarations: [PccDynamicAttachmentComponent],
  imports: [CommonModule, CustSharedModule],
})
export class DynamicAttachmentModule {}
