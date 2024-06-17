import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { QuestionQuickComponent } from './question-quick.component';

@NgModule({
  declarations: [QuestionQuickComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
})
export class QuestionQuickModule {}

