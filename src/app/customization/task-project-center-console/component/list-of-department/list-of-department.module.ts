import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared.module';
import { ListOfDepartmentComponent } from './list-of-department.component';
import { SvgFileModule } from '../svg-file/svg-file.module';



@NgModule({
  declarations: [
    ListOfDepartmentComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule,
    SvgFileModule
  ],
  exports: [
    ListOfDepartmentComponent
  ]
})
export class ListOfDepartmentModule { }
