import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiablePersonAddRoleComponent } from './liable-person-add-role.component';
import { ErrorMessageComponent } from './components/error-message/error-message.component';
import { CustSharedModule } from 'app/implementation/shared/cust-shared.module';



@NgModule({
  declarations: [LiablePersonAddRoleComponent, ErrorMessageComponent],
  imports: [
    CommonModule,
    CustSharedModule,
  ],
  exports: [LiablePersonAddRoleComponent, ErrorMessageComponent]
})
export class LiablePersonAddRoleModule { }
