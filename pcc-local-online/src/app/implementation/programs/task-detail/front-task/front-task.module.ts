import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { FrontTaskComponent } from './front-task.component';

@NgModule({
  declarations: [FrontTaskComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
})
export class FrontTaskModule {}
