import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { ApcTaskCardComponent } from './apc-task-card.component';

@NgModule({
  declarations: [ApcTaskCardComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
})
export class ApcTaskCardModule {}
