import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PageNotFoundComponent } from './page-not-found.component';
import { DwLanguageService } from '@webdpt/framework/language';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    loadChildren: () =>
      import('./implementation/implementation.module').then((m) => m.ImplementationModule),
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes
      // , { enableTracing: true } // debugging purposes only
      , { relativeLinkResolution: 'legacy' }),
  ],
  declarations: [PageNotFoundComponent],
  exports: [RouterModule],
})
export class AppRoutingModule {}
