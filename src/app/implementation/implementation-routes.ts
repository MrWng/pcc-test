import { Routes } from '@angular/router';
import { EmailLayoutComponent } from './programs/email-layout/email-layout.component';
import { PageIndexComponent } from './programs/page-index/page-index.component';
import { DwAuthGuardService } from '@webdpt/framework/auth';

export const IMPLEMENTATION_ROUTES: Routes = [
  // 設定應用開發應用模組路由
  {
    path: '', // 首頁
    component: PageIndexComponent,
    canActivate: [DwAuthGuardService],
  },
  {
    path: 'dev/:secretkey',
    pathMatch: 'prefix',
    component: EmailLayoutComponent,
    canActivate: [DwAuthGuardService],
  },
];
