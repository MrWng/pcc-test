import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { CustomQuestionRowDetailInfoComponent } from './custom-question-row-detail-info-component.component';
import { PccProblemHandlingModule } from '../../task-detail/pcc-problem-handling/pcc-problem-handling.module';
@NgModule({
  declarations: [CustomQuestionRowDetailInfoComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    PccProblemHandlingModule
  ],
  exports: [
    CustomQuestionRowDetailInfoComponent
  ]
})
export class CustomQuestionRowDetailInfoModule { }
