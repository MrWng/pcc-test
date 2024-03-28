import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { gantt } from 'dhtmlx-gantt';
import { CommonService } from 'app/implementation/service/common.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class BasicDataTemplateManageService {
  atdmUrl: string;
  bpmUrl: string;
  uibotUrl: string;
  executeContext: any;
  // 开窗所需参数
  openWindowDefine: any; // 开窗定义

  constructor(
    private translateService: TranslateService,
    private http: HttpClient,
    private configService: DwSystemConfigService,
    public commonService: CommonService
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
  }

  // 开窗获取任务模板
  getProjectTypeInfo(): Observable<any> {
    const params = {
      tmAction: {
        actionId: 'esp_bm.pisc.project.type.get',
        title: this.translateService.instant('dj-default-选择项目类型'),
        actionParams: [],
        language: {
          title: {
            en_US: 'recommend',
            zh_TW: '推薦',
          },
        },
        type: 'ESP',
        // url: 'http://esp.digiwincloud.com.cn/CROSS/RESTful',
        actionResponse: null,
        serviceName: 'bm.pisc.project.type.get',
        needProxyToken: null,
        attachActions: null,
        flatData: null,
      },
      executeContext: this.executeContext,
    };

    const url = `${this.uibotUrl}/api/ai/v1/data/query/action`;
    return this.http.post(url, params, {
      headers: this.commonService.getHeader(),
    });
  }

  /**
 * 获取项目类型编号
 */
  async getProjectInfo(project_no: any): Promise<any> {
    const project_info = [
      {
        project_no: project_no,
      },
    ];
    return await new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('bm.pisc.project.get', {
          project_info,
        })
        .subscribe((res): void => {
          resolve(res.data.project_info[0]);
        });
    });
  }
}
