import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { PccProjectInfoComponent } from './pcc_project_info.component';
import { ProjectInfoModule } from 'app/implementation/component/project_info/project_info.module';

@NgModule({
  declarations: [PccProjectInfoComponent],
  imports: [CommonModule, CustSharedModule, ProjectInfoModule],
})
export class PccProjectInfoModule {}
