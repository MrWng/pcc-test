import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { ProjectInfoMaintainComponent } from './project-info-maintain.component';
import { InputNewModule } from 'app/implementation/component/input-new/input-new.module';

@NgModule({
  declarations: [ProjectInfoMaintainComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    InputNewModule
  ],
})
export class ProjectInfoMaintainModule {}
