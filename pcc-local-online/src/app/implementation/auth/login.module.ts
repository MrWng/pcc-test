import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login/login.component';
import { DwLoginModule } from '@webdpt/components/login';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    LoginRoutingModule,
    SharedModule,
    DwLoginModule,
    NzGridModule,
    TranslateModule
  ],
  declarations: [
    LoginComponent
  ]
})
export class LoginModule { }    
