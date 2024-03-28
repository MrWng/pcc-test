import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { CommonService } from '../../service/common.service';
import { isNotEmpty } from '@athena/dynamic-core';

@Injectable()
export class ReasonForLostOrderService {
  atdmUrl: string;
  eocUrl: string;
  uibotUrl: string;
  smartDataUrl: string;
  content: any;
  executeContext: any;
  isLoadStatus: boolean = true;
  projectInfo: any = {};
  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private commonService: CommonService,
    private translateService: TranslateService
  ) {
    this.configService.get('atdmUrl').subscribe((url: string) => {
      this.atdmUrl = url;
    });
    this.configService.get('eocUrl').subscribe((url: string): void => {
      this.eocUrl = url;
    });
    this.configService.get('uibotUrl').subscribe((url: string): void => {
      this.uibotUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
  }
  /**
   * html 中文字翻译
   * @param val
   */
  translatePccWord(val: string): string {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
  translatedDefaultWord(val: string): string {
    return this.translateService.instant(`dj-default-${val}`);
  }
}
