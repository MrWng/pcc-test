import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WbsHeaderComponent } from './wbs-header.component';
import { ChangeReasonModule } from '../../../change-reason/change-reason.module';
import { CustSharedModule } from '../../../../shared.module';
import { UploadComponent } from '../uploadList/uploadList.component';
import { InputNewModule } from '../../../input-new/input-new.module';


@NgModule({
  declarations: [
    WbsHeaderComponent,
    UploadComponent,
  ],
  imports: [
    CommonModule,
    InputNewModule,
    CustSharedModule,
    ChangeReasonModule
  ],
  exports: [
    WbsHeaderComponent
  ]
})
export class WbsHeaderModule { }
