import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { CommonService } from '../../service/common.service';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class HumanResourceLoadService {
  uibotUrl: string;

  // 记录机制的content参数
  content: any;

  // 开窗所需参数
  executeContext: any;
  OpenWindowDefine: any; // 开窗定义

  smartDataUrl: string;

  // $potentialStatus = new Subject();

  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    public commonService: CommonService,
    private wbsTabsService: WbsTabsService,
    private translateService: TranslateService,
  ) {
    this.configService.get('uibotUrl').subscribe((url: string): void => {
      this.uibotUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
  }

  // 开窗获取任务模板
  getOpenWindowDefine(serviceName, paras?, dataKeys?): Observable<any> {
    paras = paras ? paras : {};
    const params = {
      tmAction: {
        actionId: 'esp_' + serviceName,
        title: this.translateService.instant('dj-default-选择任务模板'),
        actionParams: [],
        paras: paras,
        language: {
          title: {
            en_US: 'recommend',
            zh_TW: '推薦',
          },
        },
        type: 'ESP',
        actionResponse: null,
        serviceName: serviceName,
        needProxyToken: null,
        attachActions: null,
        dataKeys: dataKeys,
        flatData: null,
      },
      executeContext: this.commonService.content?.executeContext,
    };

    const url = `${this.uibotUrl}/api/ai/v1/data/query/action`;
    return this.http.post(url, params, {
      headers: this.commonService.getHeader(),
    });
  }

  // sd开窗获取任务模板
  getOpenWindowDefineSd(serviceName, paras?): Observable<any> {
    paras = paras ? paras : {};
    const params = {
      tmAction: {
        actionId: serviceName,
        title: this.translateService.instant('dj-default-选择任务模板'),
        actionParams: [],
        paras: paras,
        language: {
          title: {
            en_US: 'recommend',
            zh_TW: '推薦',
          },
        },
        type: 'SD',
        actionResponse: null,
        serviceName: serviceName,
        needProxyToken: null,
        attachActions: null,
        flatData: null,
      },
      executeContext: this.commonService.content?.executeContext,
    };

    const url = `${this.uibotUrl}/api/ai/v1/data/query/action`;
    return this.http.post(url, params, {
      headers: this.commonService.getHeader(),
    });
  }
}
