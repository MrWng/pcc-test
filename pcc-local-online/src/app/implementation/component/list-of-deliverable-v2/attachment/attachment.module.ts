import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttachmentComponent } from './attachment.component';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { AcUploadModule } from '@app-custom/ui/upload';

@NgModule({
  imports: [CommonModule, CustSharedModule],
  declarations: [AttachmentComponent],
})
export class AttachmentModule {}
