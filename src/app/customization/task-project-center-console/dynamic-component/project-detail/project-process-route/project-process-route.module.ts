import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared.module';
import { ProjectProcessRouteComponent } from './project-process-route.component';

@NgModule({
  declarations: [ProjectProcessRouteComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
})
export class ProjectProcessRouteModule {}
