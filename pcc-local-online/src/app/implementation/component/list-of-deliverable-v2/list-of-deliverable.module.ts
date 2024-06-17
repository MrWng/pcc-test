import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { SvgFileModule } from '../svg-file/svg-file.module';
import { ListOfDeliverableV2Component } from './list-of-deliverable.component';
import { ProjectFileModule } from './project-file/project-file.module';

@NgModule({
  declarations: [ListOfDeliverableV2Component],
  imports: [CommonModule, CustSharedModule, SvgFileModule],
  exports: [ListOfDeliverableV2Component],
})
export class ListOfDeliverableV2Module {}
