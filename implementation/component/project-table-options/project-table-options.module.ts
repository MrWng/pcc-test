import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectTableOptionsComponent } from './project-table-options.component';
import { ChangeReasonModule } from '../change-reason/change-reason.module';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { AcTableModule } from '@app-custom/ui/ac-table';
import { CancelCollaborationModule } from '../cancel-collaboration/cancel-collaboration.module';

@NgModule({
  declarations: [ProjectTableOptionsComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    ChangeReasonModule,
    AcTableModule,
    CancelCollaborationModule,
  ],
  exports: [ProjectTableOptionsComponent],
})
export class ProjectTableOptionsModule {}
