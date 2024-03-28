import { Routes } from '@angular/router';


import { DwAuthGuardService } from '@webdpt/framework/auth';
import { DwEmailLayoutComponent, DwPageIndexComponent } from '@webdpt/athena-dev-tools';
import { programs } from 'app/config/custom-app-config';

export const IMPLEMENTATION_ROUTES: Routes = [
  // 設定應用開發應用模組路由
  {
    path: '', // 首頁
    component: DwPageIndexComponent,
    data: {
      programs
    },
    canActivate: [DwAuthGuardService],
  },
  {
    path: 'dev/:secretkey',
    pathMatch: 'prefix',
    component: DwEmailLayoutComponent,
    data: {
      programs
    },
    canActivate: [DwAuthGuardService],
  },
];
