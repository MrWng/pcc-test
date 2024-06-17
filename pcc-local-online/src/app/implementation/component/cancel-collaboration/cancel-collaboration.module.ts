import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CancelCollaborationComponent } from './cancel-collaboration.component';
import { CustSharedModule } from '../../shared/cust-shared.module';

@NgModule({
  declarations: [CancelCollaborationComponent],
  imports: [CommonModule, CustSharedModule],
  exports: [CancelCollaborationComponent],
})
export class CancelCollaborationModule {}
