import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared.module';
import { ProjectInfoMaintainComponent } from './project-info-maintain.component';
import { InputNewModule } from 'app/customization/task-project-center-console/component/input-new/input-new.module';

@NgModule({
  declarations: [ProjectInfoMaintainComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    InputNewModule
  ],
})
export class ProjectInfoMaintainModule {}
