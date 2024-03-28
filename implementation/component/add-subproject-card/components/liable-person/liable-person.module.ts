import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiablePersonComponent } from './liable-person.component';
import { ErrorMessageComponent } from './components/error-message/error-message.component';
import { CustSharedModule } from 'app/customization/task-project-center-console/shared.module';



@NgModule({
  declarations: [LiablePersonComponent, ErrorMessageComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
  exports: [LiablePersonComponent, ErrorMessageComponent]
})
export class LiablePersonModule { }
