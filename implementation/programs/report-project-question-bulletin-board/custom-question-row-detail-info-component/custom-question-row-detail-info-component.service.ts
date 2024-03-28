import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { CommonService } from '../../../service/common.service';

@Injectable()
export class CustomQuestionRowDetailInfoService {
  atdmUrl: string;
  eocUrl: string;
  uibotUrl: string;
  smartDataUrl: string;
  content: any;
  executeContext: any;
  isLoadStatus: boolean = true;
  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private commonService: CommonService,
    private translateService: TranslateService
  ) { }
}
