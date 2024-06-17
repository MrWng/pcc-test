import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class ProjectCostBreakdownStructureService {
  atdmUrl: string;
  bpmUrl: string;
  uibotUrl: string;
  atmcUrl: any;

  // 记录机制的content参数
  content: any;

  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private translateService: TranslateService,
  ) {
    this.configService.get('atdmUrl').subscribe((url: string): void => {
      this.atdmUrl = url;
    });
    this.configService.get('bpmUrl').subscribe((url): void => {
      this.bpmUrl = url;
    });
    this.configService.get('atmcUrl').subscribe((url): void => {
      this.atmcUrl = url;
    });
    this.configService.get('uibotUrl').subscribe((url: string): void => {
      this.uibotUrl = url;
    });
  }
  getHeader(): any {
    let headers = {};
    if (this.authToken?.token) {
      // 如果有token，就添加
      headers = {
        'digi-middleware-auth-user': this.authToken.token,
        token: this.authToken.token,
      };
    }
    return headers;
  }
  getOpenwindowParams(executeContext: any, serviceName: string): any {
    return new Promise((resolve, inject) => {
      const params = {
        tmAction: {
          actionId: 'esp_' + serviceName,
          title: this.translateService.instant('dj-default-推荐'),
          actionParams: [],
          language: {
            title: {
              en_US: 'recommend',
              zh_TW: '推薦',
            },
          },
          type: 'ESP',
          url: 'http://esp.digiwincloud.com.cn/CROSS/RESTful',
          actionResponse: null,
          serviceName: serviceName,
          needProxyToken: null,
          attachActions: null,
          flatData: null,
        },
        executeContext: executeContext,
      };

      const url = `${this.uibotUrl}/api/ai/v1/data/query/action`;
      this.http
        .post(url, params, {
          headers: this.getHeader(),
        })
        .subscribe((res): void => {
          resolve(res);
        });
    });
  }
  /**
   * 获取inv_data
   * @param type products、semiproducts、material
   * */
  getInvData(actionId: string, params?: any): Observable<any> {
    const executeContext = this.content?.executeContext;
    const _params = {
      actionId, // 传参
      businessUnit: executeContext?.businessUnit, // 传参
      parameter: params,
      executeContext: executeContext, // 传参
    };
    return this.http.post(`${this.atdmUrl}/api/atdm/v1/data/query/by/actionId`, _params, {
      headers: this.getHeader(),
    });
  }
  executeAction(params: any): Observable<any> {
    return this.http.post(`${this.atmcUrl}/api/atmc/v1/action/execute`, params);
  }
  submit(params: any): Observable<any> {
    const url = `${this.bpmUrl}/v1/process-engine/workitems/dispatch-workitem`;
    return this.http.post(url, params, this.getHeader());
  }
}
