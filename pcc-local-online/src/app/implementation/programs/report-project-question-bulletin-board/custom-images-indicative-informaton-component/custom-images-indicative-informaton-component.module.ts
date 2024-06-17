import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { CustomImagesIndicativeInformatonComponent } from './custom-images-indicative-informaton-component.component';

@NgModule({
  declarations: [CustomImagesIndicativeInformatonComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
  exports: [
    CustomImagesIndicativeInformatonComponent
  ]
})
export class ProjectDeliverableModule { }
