import { ChangeDetectorRef, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { CommonService, Entry } from '../../../../service/common.service';
import { WbsTabsService } from '../../wbs-tabs.service';
import { DynamicWbsService } from '../../../wbs/wbs.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class ProjectCreationService {
  uibotUrl: string;

  // 记录机制的content参数
  content: any;

  // 开窗所需参数
  executeContext: any;
  OpenWindowDefine: any; // 开窗定义

  smartDataUrl: string;
  taskEngineUrl: string;

  // $potentialStatus = new Subject();

  constructor(
    private translateService: TranslateService,
    private http: HttpClient,
    protected changeRef: ChangeDetectorRef,
    private configService: DwSystemConfigService,
    public commonService: CommonService,
    private wbsTabsService: WbsTabsService,
    public wbsService: DynamicWbsService
  ) {
    this.configService.get('uibotUrl').subscribe((url: string): void => {
      this.uibotUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
    this.configService.get('taskEngineUrl').subscribe((url) => {
      this.taskEngineUrl = url;
    });
  }

  /**
   * 获取项目信息
   */
  getProjectInfo(source?: string): void {
    const project_info =
      this.commonService.content?.executeContext?.taskWithBacklogData?.bpmData?.project_info;
    let params: any = {
        project_info,
      },
      apiName = 'bm.pisc.project.get';
    if (source === Entry.projectChange) {
      params = {
        project_change_doc_info: [
          {
            project_no: this.wbsService.project_no,
            change_version: this.wbsService.change_version,
          },
        ],
      };
      apiName = 'bm.pisc.project.change.doc.get';
    }

    this.commonService.getInvData(apiName, params).subscribe((res: any): void => {
      this.wbsService.projectInfo =
        source === Entry.projectChange
          ? res?.data?.project_change_doc_info[0] ?? []
          : res.data.project_info[0] ?? [];
      this.wbsService.changeWbs$.next();
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

  // 开窗获取客户
  getOpenWindowDefineCustomer(serviceName, paras?, dataKeys?): Observable<any> {
    paras = paras ? paras : {};
    const params = {
      tmAction: {
        actionId: 'esp_' + serviceName,
        title: this.translateService.instant('dj-default-选择客户'),
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

  /**
   *推送流程
   *
   * @param {*} tenantId
   * @param {string} actionId
   * @param {*} params
   * @returns {Observable<any>}
   */
  postProcess(tenantId, params: any): Observable<any> {
    const executeContext = this.commonService.content?.executeContext;
    const _params = {
      tenantId,
      actionId: 'startSC_Start_ProjectCenterConsole_CloseProject',
      paras: params,
      eocMap: {
        eoc_company_id: executeContext.businessUnit.eoc_company_id,
      },
    };
    const url = `${this.smartDataUrl}/ExecutionEngine/execute`;
    return this.http.post(url, _params);
  }

  postProcessNew(locale, requesterId, params: any): Observable<any> {
    const executeContext = this.commonService.content?.executeContext;
    const _params = {
      projectCode: 'projectCenterConsole_closeProject_mainProject',
      dispatchData: params,
      process_EOC: {
        eoc_company_id: executeContext.businessUnit.eoc_company_id,
      },
      requesterId: requesterId,
      locale: locale,
      variables: {},
    };
    const url = `${this.taskEngineUrl}/api/project/create`;
    return this.http.post(url, _params);
  }
}
