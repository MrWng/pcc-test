import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MODULE_ROUTES } from '../routes';
import { DefaultLayoutComponent } from './layout/default-layout/default-layout.component';
import { DwLanguageService } from '@webdpt/framework/language';
import { DwSsoLoginComponent } from '@webdpt/components/sso-login';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: DefaultLayoutComponent,
    children: [...MODULE_ROUTES],
    data: {
      dwRouteData: {
        programId: 'default',
        i18n: ['basic', 'ant-components'],
      },
    },
    resolve: {
      transaction: DwLanguageService,
    },
  },
  {
    path: 'login',
    pathMatch: 'full',
    loadChildren: (): any => import('./auth/login.module').then((m) => m.LoginModule),
    data: {
      dwRouteData: {
        programId: 'login',
      },
    },
    resolve: {
      transaction: DwLanguageService,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ImplementationRoutingModule {}
