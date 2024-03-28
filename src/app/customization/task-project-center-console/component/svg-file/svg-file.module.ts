import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared.module';
import { SvgFileComponent } from './svg-file.component';



@NgModule({
  declarations: [
    SvgFileComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule
  ],
  exports: [
    SvgFileComponent
  ]
})
export class SvgFileModule { }
