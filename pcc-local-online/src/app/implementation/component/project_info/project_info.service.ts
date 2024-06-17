import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework';
import { CommonService } from '../../service/common.service';

@Injectable()
export class ProjectInfoService {
  atdmUrl: string;
  eocUrl: string;
  uibotUrl: string;
  smartDataUrl: string;
  content: any;
  executeContext: any;
  isLoadStatus: boolean = true;
  OpenWindowDefine: any; // 开窗定义
  /**
   * 获取所有人员列表
   */
  personList: any = [];
  // 是否启动地端
  hasGroundEnd = 'N';
  audcUrl: string;
  // 是否点击潜在按钮 0: 潜在 1: 取消 2:已转正式
  potentialStatus: number = 0;
  /** 是否显示启动专案 */
  isShowStart = true;
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
  /**
   * 获取项目类型编号
   */
  async getProjectInfo(project_no: any, change_version?): Promise<any> {
    if (change_version) {
      const project_change_doc_info = [
        {
          project_no: project_no,
          change_version,
        },
      ];
      return await new Promise((resolve, reject): void => {
        this.commonService
          .getInvData('bm.pisc.project.change.doc.get', {
            project_change_doc_info,
          })
          .subscribe((res): void => {
            resolve(res.data.project_change_doc_info[0]);
          });
      });
    }

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
