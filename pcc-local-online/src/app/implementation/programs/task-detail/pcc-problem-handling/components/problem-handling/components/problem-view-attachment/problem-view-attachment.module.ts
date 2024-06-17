import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { ProblemViewAttachmentComponent } from './problem-view-attachment.component';

@NgModule({
  imports: [CommonModule, CustSharedModule],
  declarations: [ProblemViewAttachmentComponent],
  exports: [ProblemViewAttachmentComponent],
})
export class ProblemViewAttachmentModule {}
