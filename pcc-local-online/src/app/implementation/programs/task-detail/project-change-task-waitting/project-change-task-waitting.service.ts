import { Inject, Injectable } from '@angular/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { CommonService, Entry } from '../../../service/common.service';
import { TranslateService } from '@ngx-translate/core';
import { DwUserService } from '@webdpt/framework/user';
import { MqttChannel, MqttService, cloneDeep } from '@athena/dynamic-core';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';

@Injectable()
export class ProjectChangeTaskWaittingService {
  atdmUrl: string;
  bpmUrl: string;
  uibotUrl: string;
  smartDataUrl: string;
  taskEngineUrl: string;
  /** 是否显示启动专案 */
  isShowStart = true;

  // 记录机制的content参数
  model: any;
  content: any;
  // 开窗所需参数
  executeContext: any;
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
  // 暂存wbsService.projectInfo的副本(非拷贝)：项目变更和项目中控台数据源切换
  projectInfoCopy: any;
  // 暂存wbsService.projectChangeDoc的副本(非拷贝)：项目变更和项目中控台数据源切换
  projectChangeDocCopy: any;
  constructor(
    private translateService: TranslateService,
    private http: HttpClient,
    private configService: DwSystemConfigService,
    public commonService: CommonService,
    private userService: DwUserService,
    public mqttService: MqttService,
    public wbsService: DynamicWbsService
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

  executionEngine(tenantId, params: any, content: any): Observable<any> {
    const executeContext = content.executeContext;
    const _params = {
      tenantId,
      actionId: 'startProcess_ProjectCenterConsole_CoordinationPlanArrange_Recycle',
      paras: params,
      eocMap: {
        eoc_company_id: executeContext.businessUnit.eoc_company_id,
      },
    };
    const url = `${this.smartDataUrl}/ExecutionEngine/execute`;
    return this.http.post(url, _params);
  }
  /**
   * @param index -1 - 其他 1 - 项目信息维护 2 - 参与人员
   */
  changeDataOriginByTabIndex(index = -1) {
    this.projectInfoCopy = this.projectInfoCopy
      ? this.projectInfoCopy
      : this.wbsService.projectInfo;
    this.projectChangeDocCopy = this.projectChangeDocCopy
      ? this.projectChangeDocCopy
      : this.wbsService.projectChangeDoc;
    switch (index) {
      case 1: // 项目基本信息维护
      case 2: // 参与人员
        this.wbsService.projectInfo = this.projectChangeDocCopy;
        break;
      default:
        this.wbsService.projectInfo = this.projectInfoCopy;
    }
  }
  /**
   * 启动项目，
   * 清理协同的项目卡和任务卡
   */
  createProject(locale, requesterId, params: any, content: any): Observable<any> {
    const executeContext = content.executeContext;
    const _params = {
      serviceComposerId: 'pcc_closeTeamWork',
      eocMap: {
        eoc_company_id: executeContext.businessUnit.eoc_company_id,
      },
      asyncComplete: false,
      tenantId: this.userService.getUser('tenantId'),
      params: {
        projectArr: params,
      },
    };
    console.log('调用dispatch');
    const myDate = new Date();
    const str = myDate.toTimeString();
    console.log(str);
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, _params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }

  /**
   * 开窗获取任务模板
   * 使用场景：
   * 1）基础资料 - 项目模板：入参：无
   * 2）项目计划维护 - 使用职能模板：入参：同前
   * 3）编辑WBS卡片 - 使用模板（涉及：计划维护 / 协同功能）：入参：同前
   */
  getTaskTemplate(paras: any): Observable<any> {
    // spring 3.1 更换api名称  [入参]：'project.template.info.get' ==> 'bm.pisc.project.template.get'
    const params = {
      tmAction: {
        actionId: 'esp_bm.pisc.project.template.get',
        title: this.translateService.instant('dj-default-选择项目模板'),
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
        serviceName: 'bm.pisc.project.template.get',
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

  evokeGuidance(modularCode: string, code: string, appCode: string, subKey: string): void {
    if (!subKey) {
      const data = {
        content: null,
        type: MqttChannel.OPHD,
      };
      this.mqttService.manualSendMessage(data);
    } else {
      const url = `${this.audcUrl}/api/guide/call?modularCode=${modularCode}&code=${code}&appCode=${appCode}&subKey=${subKey}`;
      this.http.get(url).subscribe((res: any): void => {
        if (res?.data?.retCode === 0 && res?.data?.data?.length) {
          const data = {
            content: res?.data?.data,
            type: MqttChannel.OPHD,
          };
          this.mqttService.manualSendMessage(data);
        }
      });
    }
  }

  /**
   * 获取项目类型编号
   */
  async getProjectInfo(project_no: any): Promise<any> {
    const project_change_doc_info = [
      {
        project_no: project_no,
        change_version: this.wbsService.change_version
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
}
