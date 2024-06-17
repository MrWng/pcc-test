import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { ReportProjectQuestionComponent } from './report-project-question-bulletin-board.component';
import { AthModalModule } from '@athena/design-ui/src/components/modal';
import { AthOpenWindowModule } from '@athena/design-ui/src/components/open-window';
import { IconModule } from '@athena/design-ui/src/components/icon';
import { InputGroupOpenWindowModule } from '../../../implementation/component/input-group-open-window/input-group-open-window.module';
@NgModule({
  declarations: [ReportProjectQuestionComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    AthModalModule,
    AthOpenWindowModule,
    IconModule,
    InputGroupOpenWindowModule
  ],
})
export class ReportProjectQuestionModule {}
