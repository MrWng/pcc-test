import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../../shared/cust-shared.module';
import { PccUploadFileComponent } from './upload-file.component';

@NgModule({
  declarations: [PccUploadFileComponent],
  imports: [CommonModule, CustSharedModule],
  exports: [PccUploadFileComponent],
})
export class PccUploadFileModule {}
