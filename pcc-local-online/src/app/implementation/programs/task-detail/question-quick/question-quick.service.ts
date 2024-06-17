import { Inject, Injectable } from '@angular/core';
import { CommonService } from '../../../service/common.service';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from '@athena/dynamic-core';
import { Observable, ReplaySubject } from 'rxjs';
import { DwSystemConfigService } from '@webdpt/framework/config';

@Injectable()
export class QuestionQuickService {
  atdmUrl: string;
  bpmUrl: string;
  uibotUrl: string;
  smartDataUrl: string;
  taskEngineUrl: string;
  audcUrl: string;
  group: any;
  personList: any = new ReplaySubject();

  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    protected translateService: TranslateService,
    protected commonService: CommonService,
    private configService: DwSystemConfigService,
  ) {
    this.configService.get('atdmUrl').subscribe((url: string): void => {
      this.atdmUrl = url;
    });
    this.configService.get('bpmUrl').subscribe((url) => {
      this.bpmUrl = url;
    });
    this.configService.get('uibotUrl').subscribe((url: string): void => {
      this.uibotUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
    this.configService.get('taskEngineUrl').subscribe((url) => {
      this.taskEngineUrl = url;
    });
    this.configService.get('audcUrl').subscribe((url) => {
      this.audcUrl = url;
    });
  }

}
