import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HumanResourceLoadComponent } from './human-resource-load.component';
import { CustSharedModule } from '../../shared.module';
import { InputNewModule } from '../input-new/input-new.module';
import { SvgFileModule } from '../svg-file/svg-file.module';



@NgModule({
  declarations: [
    HumanResourceLoadComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule,
    InputNewModule,
    SvgFileModule
  ],
  exports: [
    HumanResourceLoadComponent
  ]
})
export class HumanResourceLoadModule { }
