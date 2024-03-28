import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework';
import { CommonService } from '../../../service/common.service';

@Injectable()
export class ProjectPlanManageService{
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
   * 这是一个请求示例，可以自行修改或删除
   */
  demo_api_data_get(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('item.supply.demand.data.get', {
          query_condition: params,
        })
        .subscribe((res): void => {
          resolve(res.data.demand_data);
        });
    });
  }
}
