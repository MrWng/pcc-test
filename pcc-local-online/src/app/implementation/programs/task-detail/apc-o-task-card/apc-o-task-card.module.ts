import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { ApcOTaskCardComponent } from './apc-o-task-card.component';

@NgModule({
  declarations: [ApcOTaskCardComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
})
export class ApcOTaskCardModule {}
