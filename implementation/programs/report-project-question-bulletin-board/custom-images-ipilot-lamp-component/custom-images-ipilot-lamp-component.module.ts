import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { CustomImagesIpilotLampComponent } from './custom-images-ipilot-lamp-component.component';

@NgModule({
  declarations: [CustomImagesIpilotLampComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
  exports: [
    CustomImagesIpilotLampComponent
  ]
})
export class ProjectDeliverableModule { }
