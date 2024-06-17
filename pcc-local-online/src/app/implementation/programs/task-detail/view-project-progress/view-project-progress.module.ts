import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { ViewProjectProgressComponent } from './view-project-progress.component';
import { DynamicWbsModule } from 'app/implementation/component/wbs/wbs.module';

@NgModule({
  declarations: [ViewProjectProgressComponent],
  imports: [CommonModule, CustSharedModule, DynamicWbsModule],
})
export class ViewProjectProgressModule {}
