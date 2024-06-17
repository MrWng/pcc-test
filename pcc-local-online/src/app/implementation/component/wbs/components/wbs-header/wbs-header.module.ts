import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WbsHeaderComponent } from './wbs-header.component';
import { ChangeReasonModule } from '../../../change-reason/change-reason.module';
import { CustSharedModule } from '../../../../shared/cust-shared.module';
import { UploadComponent } from '../uploadList/uploadList.component';
import { InputNewModule } from '../../../input-new/input-new.module';
import { LoadingModalModule } from '../../../loading-modal/loading-modal.module';
// 光斯奥丢单原因组件
import { ReasonForLostOrderComponent } from 'app/implementation/individual-case/reason-for-lost-order/reason-for-lost-order.component';
import { CustWbsSharedModule } from 'app/implementation/shared/wbs-shared.module';
import { PccUploadFileModule } from 'app/implementation/component/wbs/components/upload-file/upload-file.module';

@NgModule({
  declarations: [WbsHeaderComponent, UploadComponent, ReasonForLostOrderComponent],
  imports: [
    CommonModule,
    InputNewModule,
    CustSharedModule,
    CustWbsSharedModule,
    ChangeReasonModule,
    LoadingModalModule,
    PccUploadFileModule,
  ],
  exports: [WbsHeaderComponent],
})
export class WbsHeaderModule {}
