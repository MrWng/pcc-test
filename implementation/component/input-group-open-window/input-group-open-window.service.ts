import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { OpenWindowService } from '@athena/dynamic-ui';
import { CommonService } from 'app/implementation/service/common.service';
import { FormBuilder } from '@angular/forms';

@Injectable()
export class InputGroupOpenWindowModalService {
  uibotUrl: string;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private configService: DwSystemConfigService,
    protected translateService: TranslateService,
    public openWindowService: OpenWindowService,
    public commonService: CommonService,
  ) {
    this.configService.getConfig().subscribe((urls: any) => {
      this.uibotUrl = urls.uibotUrl;
    });
  }

  // 单选开窗
  getOpenWindowDefine(title, serviceName, executeContext, paras?, dataKeys?): Observable<any> {
    paras = paras ? paras : {
      // 可在此添加接口入参，根据 M.MF 来添加
      // task_template_parameter_info: [
      //   {
      //     manage_status: 'V',
      //   },
      // ]
    };
    const params = {
      tmAction: {
        actionId: 'esp_' + serviceName,
        title,
        actionParams: [],
        paras: paras,
        language: {
          title: {
            en_US: 'recommend',
            zh_TW: '推薦',
          }
        },
        type: 'ESP',
        actionResponse: null,
        serviceName: serviceName,
        needProxyToken: null,
        attachActions: null,
        dataKeys: dataKeys,
        flatData: null,
      },
      executeContext
    };

    const url = `${this.uibotUrl}/api/ai/v1/data/query/action`;
    return this.http.post(url, params, {
      headers: this.commonService.getHeader(),
    });
  }
}
