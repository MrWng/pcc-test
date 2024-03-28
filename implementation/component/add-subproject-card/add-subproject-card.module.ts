import { NgModule } from '@angular/core';
import { CustSharedModule } from '../../shared/cust-shared.module';
import { AddSubprojectCardComponent } from './add-subproject-card.component';
import { WorkLoadComponent } from './components/work-load/work-load.component';
import { UploadFileComponent } from './components/upload-file/upload-file.component';
import { TaskTemplateComponent } from './components/task-template/task-template.component';
import { PreTaskComponent } from './components/pre-task/pre-task.component';
import { PaymentStageComponent } from './components/payment-stage/payment-stage.component';
import { MoreControlComponent } from './components/more-control/more-control.component';
import { IsNeedDocNoComponent } from './components/is-need-doc-no/is-need-doc-no.component';
import { CardHeaderComponent } from './components/card-header/card-header.component';
import { AdvancedOptionComponent } from './components/advanced-option/advanced-option.component';
import { EocSelectComponent } from './components/eoc-select/eoc-select.component';
import { ChangeReasonModule } from '../change-reason/change-reason.module';
import { TaskClassificationComponent } from './components/task-classification/task-classification.component';
import { DifficultyLevelComponent } from './components/difficulty-level/difficulty-level.component';
import { InputNewModule } from '../input-new/input-new.module';
import { StandardWorkingHoursComponent } from '../../individual-case/standard-working-hours-mc-pcc-input/standard-working-hours.component';
import { LiablePersonModule } from './components/liable-person/liable-person.module';
import { LiablePersonAddRoleModule } from './components/liable-person-add-role/liable-person-add-role.module';

const components = [
  AddSubprojectCardComponent,
  AdvancedOptionComponent,
  CardHeaderComponent,
  IsNeedDocNoComponent,
  MoreControlComponent,
  PaymentStageComponent,
  PreTaskComponent,
  TaskTemplateComponent,
  UploadFileComponent,
  WorkLoadComponent,
  EocSelectComponent,
  TaskClassificationComponent,
  DifficultyLevelComponent,
  StandardWorkingHoursComponent
];

@NgModule({
  declarations: [...components],
  imports: [
    CustSharedModule,
    ChangeReasonModule,
    InputNewModule,
    LiablePersonModule,
    LiablePersonAddRoleModule
  ],
  exports: [AddSubprojectCardComponent],
})
export class AddSubprojectCardModule { }
