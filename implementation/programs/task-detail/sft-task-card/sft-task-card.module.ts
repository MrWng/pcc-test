import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared.module';
import { SftTaskCardComponent } from './sft-task-card.component';

@NgModule({
  declarations: [SftTaskCardComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
})
export class SftTaskCardModule {}
