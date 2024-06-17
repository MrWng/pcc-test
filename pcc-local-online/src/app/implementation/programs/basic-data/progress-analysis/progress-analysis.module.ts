import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { ProgressAnalysisComponent } from './progress-analysis.component';
import { TaskAnalysisComponent } from './components/task-analysis/task-analysis.component';
import { ProjectAnalysisComponent } from './components/project-analysis/project-analysis.component';
import { CurrentStatusComponent } from './components/project-analysis/current-status/current-status.component';
import { ProgressLineComponent } from './components/project-analysis/progress-line/progress-line.component';
import { TaskProgressLineComponent } from './components/task-analysis/task-progress-line/task-progress-line.component';
import { GanttModule } from 'app/implementation/component/gantt/gantt.module';

@NgModule({
  declarations: [
    ProgressAnalysisComponent,
    TaskAnalysisComponent,
    ProjectAnalysisComponent,
    CurrentStatusComponent,
    ProgressLineComponent,
    TaskProgressLineComponent
  ],
  imports: [
    CommonModule,
    CustSharedModule,
    GanttModule
  ],
})
export class ProgressAnalysisModule {}
