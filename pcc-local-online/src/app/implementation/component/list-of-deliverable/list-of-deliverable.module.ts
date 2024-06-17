import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { ListOfDeliverableComponent } from './list-of-deliverable.component';
import { SvgFileModule } from '../svg-file/svg-file.module';



@NgModule({
  declarations: [
    ListOfDeliverableComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule,
    SvgFileModule
  ],
  exports: [
    ListOfDeliverableComponent
  ]
})
export class ListOfDeliverableModule { }
