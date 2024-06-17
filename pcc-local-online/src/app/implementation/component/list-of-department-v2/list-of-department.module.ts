import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { ListOfDepartmentV2Component } from './list-of-department.component';
import { SvgFileModule } from '../svg-file/svg-file.module';
import { AcTreeModule } from '@app-custom/ui/ac-tree';
import { AcOperationButtonSaveModule } from '@app-custom/ui/operation-button-save';

@NgModule({
  declarations: [ListOfDepartmentV2Component],
  imports: [
    CommonModule,
    CustSharedModule,
    SvgFileModule,
    AcTreeModule,
    AcOperationButtonSaveModule,
  ],
  exports: [ListOfDepartmentV2Component],
})
export class ListOfDepartmentV2Module {}
