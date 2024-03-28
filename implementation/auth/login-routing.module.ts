import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { DwLanguageService } from '@webdpt/framework/language';

const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    pathMatch: 'prefix',
  },
  // {
  //   path: 'register',
  //   component: RegisterComponent
  // },
  // {
  //   path: 'forgot',
  //   component: ForgotComponent
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginRoutingModule {}
