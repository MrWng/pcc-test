import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared.module';
import { PosumTaskCardComponent } from './posum-task-card.component';
import { SvgFileModule }
  from 'app/customization/task-project-center-console/component/svg-file/svg-file.module';
import { TaskCardTablleComponent } from './components/task-card-table/task-card-tablle.component';
import { TableDetailComponent } from './components/table-detail/table-detail.component';

@NgModule({
  declarations: [
    PosumTaskCardComponent,
    TaskCardTablleComponent,
    TableDetailComponent],
  imports: [
    CommonModule,
    CustSharedModule,
    SvgFileModule
  ],
})
export class PosumTaskCardModule { }
