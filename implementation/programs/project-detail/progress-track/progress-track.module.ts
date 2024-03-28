import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { ProgressTrackComponent } from './progress-track.component';
import { DynamicWbsModule } from 'app/implementation/component/wbs/wbs.module';

@NgModule({
  declarations: [ProgressTrackComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    DynamicWbsModule
  ],
})
export class ProgressTrackModule {}
