import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeReasonComponent } from './change-reason.component';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { PccUploadFileModule } from '../wbs/components/upload-file/upload-file.module';

@NgModule({
  declarations: [ChangeReasonComponent],
  imports: [CommonModule, CustSharedModule, PccUploadFileModule],
  exports: [ChangeReasonComponent],
})
export class ChangeReasonModule {}
