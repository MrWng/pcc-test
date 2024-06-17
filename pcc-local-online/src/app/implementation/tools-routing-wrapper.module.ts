import { NgModule } from '@angular/core';
import { SharedModule } from './shared/shared.module';

@NgModule({
  imports: [
    SharedModule, // 專案的共享模組
  ],
})
export class ToolsRoutingWrapper {}
