import { Inject, Injectable } from '@angular/core';
import { CommonService } from '../../../service/common.service';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class ViewProjectProgressService {

  group: any;

  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    protected translateService: TranslateService,
    protected commonService: CommonService
  ) { }


}
