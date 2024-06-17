import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskDetailIndividualCaseComponent } from './task-detail.component';
import { ExportComponent } from './export/export.component';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';
import { AcTableModule } from '@app-custom/ui/ac-table';
import { AcFullScreenModule } from '@app-custom/ui/full-screen';
import { FullScreenComponent } from './full-screen/full-screen.component';
import { PercentComponent } from './percent/percent.component';
import { WorkstationTypeComponent } from './workstation-type/workstation-type.component';

@NgModule({
  imports: [CommonModule, CustSharedModule, AcTableModule, AcFullScreenModule],
  declarations: [
    TaskDetailIndividualCaseComponent,
    ExportComponent,
    FullScreenComponent,
    PercentComponent,
    WorkstationTypeComponent,
  ],
  exports: [TaskDetailIndividualCaseComponent],
})
export class TaskDetailIndividualCaseModule {}
