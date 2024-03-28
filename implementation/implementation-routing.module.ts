import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MODULE_ROUTES } from '../routes';
import { DwLanguageService } from '@webdpt/framework/language';
import { DwSsoLoginComponent } from '@webdpt/components/sso-login';
import { DwLayoutAthenaComponent } from '@webdpt/athena-dev-tools';
import { programs } from 'app/config/custom-app-config';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: DwLayoutAthenaComponent,
    children: [...MODULE_ROUTES],
    data: {
      programs,
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
