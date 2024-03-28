import { Injectable, Inject } from '@angular/core';
import { from, Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { DwUserService } from '@webdpt/framework/user';
import { TranslateService } from '@ngx-translate/core';
import { retry } from 'rxjs/operators';
import { format } from 'path';

/**
 * wbs入口
 */
// eslint-disable-next-line no-shadow
export enum Entry {
  // 1: 项目中台 -- 项目计划维护; 2:模版维护 ; 3: 协同计划排定;
  // 代办--项目卡--(wbs计划维护、进度追踪）
  card = 'card',
  // 基础资料--项目模版维护--wbs计划维护
  maintain = 'maintain',
  // 代办--任务卡--协同任务卡--wbs计划维护
  collaborate = 'collaborate',
  // 代办--任务卡--项目计划--wbs计划维护
  plan = 'plan',
}

@Injectable({
  providedIn: 'root',
})

export class CommonService {
  atdmUrl: string;
  bpmUrl: string;
  eocUrl: string;
  smartDataUrl: string;
  taskEngineUrl: string;
  knowledgeMapsUrl: string;
  // 记录机制的content参数
  content: any;
  iamUrl: any;

  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private userService: DwUserService,
    private translateService: TranslateService,
  ) {

    this.configService.get('atdmUrl').subscribe((url: string): void => {
      this.atdmUrl = url;
    });

    this.configService.get('bpmUrl').subscribe((url) => {
      this.bpmUrl = url;
    });

    this.configService.get('eocUrl').subscribe((url: string): void => {
      this.eocUrl = url;
    });

    this.configService.get('taskEngineUrl').subscribe((url) => {
      this.taskEngineUrl = url;
    });

    this.configService.get('knowledgeMapsUrl').subscribe((url) => {
      let index = url.lastIndexOf('/');
      index = index === -1 ? url.length : index;
      this.knowledgeMapsUrl = url.substring(0, index);
    });

    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });

    this.configService.get('iamUrl').subscribe((url) => {
      this.iamUrl = url;
    });
  }

  getHeader() {
    const header = {
      'digi-middleware-auth-user': this.authToken?.token,
      token: this.authToken?.token,
    };
    return this.authToken.token ? header : {};
  }

  /**
 * 获取是否启动地端
 * @param tenantId
 * @param variableName
 * @returns
 */
  getHasGroundEnd(tenantId: any, variableName: any): Observable<any> {
    const url = `${this.knowledgeMapsUrl}/service/knowledgegraph/Mechanism/Variable?variableName=${variableName}&tenantId=${tenantId}`;
    return this.http.get(url);
  }


  /**
  * 是否依赖地端
  */
  isDependsGround(): Observable<any> {
    const executeContext = this.content.executeContext;
    const _params = {
      tenantId: this.userService.getUser('tenantId'),
      actionId: 'projectCenterConsole_DataPulling',
      paras: [],
      eocMap: {
        eoc_company_id: executeContext.businessUnit.eoc_company_id,
      },
    };
    const url = `${this.smartDataUrl}/ExecutionEngine/execute`;
    return this.http.post(url, _params);
  }

  hasDependsGround(): Observable<any> {
    const tenantId = this.userService.getUser('tenantId');
    const url = `${this.knowledgeMapsUrl}/service/knowledgegraph/Mechanism/Variable?variableName=hasGroundEnd&tenantId=${tenantId}`;
    return this.http.get(url);
  }

  /**
   * 获取机制参数
   * @param variableName ：需要获取的 机制参数 [projectPlanFlow 项目计划流程]
   * @returns 机制参数 状态值
   */
  getMechanismParameters(variableName: string): Observable<any> {
    const tenantId = this.userService.getUser('tenantId');
    const url = `${this.knowledgeMapsUrl}/service/knowledgegraph/Mechanism/Variable?variableName=${variableName}&tenantId=${tenantId}`;
    return this.http.get(url);
  }

  /**
 * 查询代理人信息
 */
  getAgentInfo(param: any): Observable<any> {
    return this.http.post(`${this.eocUrl}/api/eoc/v2/emp/agent`, param);
  }


  /**
 * 获取用户信息
 * @param params
 * @returns
 */
  searchUserInfo(params: any): Observable<any> {
    const url = `${this.eocUrl}/api/eoc/v2/emp/info`;
    return this.http.post(url, params);
  }

  /**
   * 获取任务信息
   */
  getTaskInfo(project_no, source): Observable<any> {
    const params = {
      project_info: [
        {
          control_mode: '1',
          task_property: source === Entry.maintain ? '2' : '1',
          project_no
        },
      ],
    };
    return this.getInvData('task.info.get', params);
  }


  /**
   * 获取协同任务卡
   */
  getCollaborationCard(project_no): Observable<any> {
    const params = {
      assist_schedule_info: [
        {
          schedule_status: '1',
          project_no
        },
      ],
    };
    // spring 3.2 更换api名称 [入参、出参]：'teamwork.task.plan.info.get' ==> 'bm.pisc.assist.schedule.get'
    return this.getInvData('bm.pisc.assist.schedule.get', params);
  }


  /**
 * 获取inv_data
 * @param actionId : 要调用的 API地址
 * @param params : 如，project_info[{control_mode: "1", project_no: "051901"}]
 * @param eocMap : 无，undefined
 * @returns
 */
  getInvData(actionId: string, params: any, eocMap?: any): Observable<any> {
    const executeContext = this.content?.executeContext;
    const _params = {
      actionId,
      businessUnit: eocMap ? { eoc_company_id: eocMap } : executeContext?.businessUnit, // 传参
      parameter: params,
      executeContext: executeContext,
    };
    return this.http.post(`${this.atdmUrl}/api/atdm/v1/data/query/by/actionId`, _params, {
      headers: this.getHeader(),
    });
  }

  // 获取角色信息
  queryCatalog(): Observable<any> {
    return this.http.post(`${this.iamUrl}/api/iam/v2/role/catalog/query`, { id: 'defaultRoleCatalog' }, {
      headers: this.getHeader(),
    });
  }

  /**
 * 推DTD流程
 * 场景：
 * 项目卡：启动项目
 * 母子项目：结案按钮
 * 协同任务卡提交按钮
 *
 */
  pushDTDProcess(projectNo: string): void {
    const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo ?? '{}');
    const { taskWithBacklogData } = this.content?.executeContext ?? {};
    const workitemListItem = taskWithBacklogData?.backlog[0]?.workitemList[0];
    const submit_params = {
      locale: DwUserInfo.acceptLanguage,
      workitemId: workitemListItem?.workitemId,
      performerId: workitemListItem?.performerId,
      processVariables: { project_no: projectNo },
      dispatchData: [{ project_no: projectNo }],
      comment: '',
    };
    console.log('调用submit-dispatch-data');
    const myDate = new Date();
    const str = myDate.toTimeString();
    console.log(str);
    this.submitDispatchData(submit_params).subscribe((): void => {
    });
  }

  /**
 * 推送DTD提交流程
 * @param params
 * @returns
 */
  submitData(params: any): Observable<any> {
    const url = `${this.taskEngineUrl}/api/task/manual/submit-data`;
    return this.http.post(url, params, {
      headers: this.getHeader(),
    });
  }

  /**
   * 合并submit-data和dispatch接口
   * submit - dispatch - data
   */
  submitDispatchData(params: any): Observable<any> {
    console.log('调用submit-dispatch-data');
    const url = `${this.taskEngineUrl}/api/task/manual/submit-dispatch-data`;
    return this.http.post(url, params, {
      headers: this.getHeader(),
    });
  }


  /**
 * 推送DTD分发流程
 * @param params
 * @returns
 */
  dispatch(params: any): Observable<any> {
    const url = `${this.taskEngineUrl}/api/task/manual/dispatch`;
    return this.http.post(url, params, {
      headers: this.getHeader(),
    });
  }

  submit(params: any): Observable<any> {
    const url = `${this.bpmUrl}/v1/process-engine/workitems/dispatch-workitem`;
    return this.http.post(url, params, {
      headers: this.getHeader(),
    });
  }

  // 获取table layout   特殊列手动push添加
  getLayout(params: any) {
    const list = [];
    for (const i in params) {
      if (params.hasOwnProperty(i)) {
        const columns = params[i]?.columns ? params[i].columns : [
          {
            schema: params[i].schema ? params[i].schema : '',
            headerName: params[i].headerName ? params[i].headerName : '',
            level: 0,
            path: params[i].schema ? params[i].schema : ''
          },
        ];
        const column = {
          headerName: params[i].headerName ? params[i].headerName : '',
          level: 0,
          path: 'inquiry',
          operations: [],
          columns: columns
        };
        if (params[i].editable) {
          const arr = {
            editor: {
              id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
              schema: params[i].schema ? params[i].schema : '',
              type: params[i].type ? params[i].type : 'INPUT',
              showIcon: params[i].showIcon ? params[i].showIcon : false,
              editable: true,
            },
          };
          column.columns[0] = Object.assign(column.columns[0], arr);
        }
        if (params[i].upload) {
          const arr = {
            type: 'TASK_FILE_UPLOAD',
            attribute: {
              operations: [
                {
                  actionParas: [
                    { type: 'VARIABLE', value: 'id', key: 'id' },
                    { type: 'VARIABLE', value: 'name', key: 'name' },
                    { type: 'VARIABLE', value: 'row_data', key: 'rowDataKey' },
                    { type: 'VARIABLE', value: 'category', key: 'category' },
                    { type: 'VARIABLE', value: 'categoryId', key: 'categoryId' },
                    { type: 'VARIABLE', value: 'size', key: 'size' },
                  ],
                  type: 'upload',
                },
              ],
              fileMaxSize: 104857600,
              readEnable: true,
              readCategory: [
                'manualAssignmentDelivery',
                'manualAssignmentAttachment',
                'mohDeliverable',
                'mohAttachment',
                'athena_LaunchSpecialProject_create',
                'manualAssignmentSampleDelivery',
              ],
              id: '9854a0d3-38cb-46d1-a16a-037952943ca8',
            },
          };
          column.columns[0] = Object.assign(column.columns[0], arr);
        }
        list.push(column);
      }
    }
    return list;
  }

  // 获取table layout   特殊列手动push添加
  getLayoutNew(params: any) {
    const list = [];
    for (const i in params) {
      if (params.hasOwnProperty(i)) {
        const columns = params[i]?.columns ? params[i].columns : [
          {
            schema: params[i].schema ? params[i].schema : '',
            headerName: params[i].headerName ? params[i].headerName : '',
            level: 0,
            path: params[i].schema ? params[i].schema : '',
          },
        ];
        if (!params[i].upload && !params[i]?.columns) {
          columns[0].editor = {
            id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
            schema: params[i].schema ? params[i].schema : '',
            showIcon: false,
            type: params[i].type ? params[i].type : 'INPUT',
            editable: false,
            disabled: true,
          };
        }
        console.log(columns);

        const column = {
          headerName: params[i].headerName ? params[i].headerName : '',
          operations: [],
          level: 0,
          path: 'inquiry',
          columns: columns
        };
        if (params[i].editable) {
          const arr = {
            editor: {
              id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
              schema: params[i].schema ? params[i].schema : '',
              type: params[i].type ? params[i].type : 'INPUT',
              showIcon: params[i].showIcon ? params[i].showIcon : false,
              editable: true,
            },
          };
          column.columns[0] = Object.assign(column.columns[0], arr);
        }
        if (params[i].upload) {
          const arr = {
            type: 'TASK_FILE_UPLOAD',
            tagDefinitions: [
              {
                code: 'TYPE_STRING',
                name: this.translateService.instant('dj-pcc-数据组件'),
                description: this.translateService.instant('dj-pcc-数据组件'),
                category: 'DATATYPE',
                interpreterServiceName: 'typeStringTagInterpreter',
                customize: false,
                themeMapTag: {
                  id: 802020055,
                  name: 'xxxx',
                  code: 'UNEDITABLE',
                  category: 'BUSINESS',
                  uiBotCode: 'UNEDITABLE',
                },
              },
            ],
            attribute: {
              operations: [
                {
                  actionParas: [
                    { type: 'VARIABLE', value: 'id', key: 'id' },
                    { type: 'VARIABLE', value: 'name', key: 'name' },
                    { type: 'VARIABLE', value: 'row_data', key: 'rowDataKey' },
                    { type: 'VARIABLE', value: 'category', key: 'category' },
                    { type: 'VARIABLE', value: 'categoryId', key: 'categoryId' },
                    { type: 'VARIABLE', value: 'size', key: 'size' },
                  ],
                  type: 'upload',
                },
              ],
              fileMaxSize: 104857600,
              readEnable: true,
              readCategory: [
                'manualAssignmentDelivery',
                'manualAssignmentAttachment',
                'mohDeliverable',
                'mohAttachment',
                'athena_LaunchSpecialProject_create',
                'manualAssignmentSampleDelivery',
              ],
              id: '9854a0d3-38cb-46d1-a16a-037952943ca8',
            },
          };
          column.columns[0] = Object.assign(column.columns[0], arr);
        }
        list.push(column);
      }
    }
    return list;
  }
  // 获取athena-table layout   特殊列手动push添加
  getAllFields(params: any) {
    const list = [];
    for (const i in params) {
      if (params.hasOwnProperty(i)) {
        const column = {
          headerName: params[i].headerName ? params[i].headerName : '',
          name: params[i].schema ? params[i].schema : '',
          dataType: params[i].dataType ? params[i].dataType : 'string',
          defaultValue: '',
          isDataKey: true,
          isShow: true,
          level: 0,
          path: 'inquiry',
        };
        list.push(column);
      }
    }
    return list;
  }

  // 调服务编排
  getServiceOrchestration(param: any): Observable<any> {
    const params = {
      serviceComposerId: 'pcc_maintainFirstLevelPlan',
      eocMap: {},
      asyncComplete: false,
      tenantId: this.userService.getUser('tenantId'),
      params: param
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }

  /**
 * 字符串转Number
 * @param val 字符串
 * @returns number
 */
  numberFn(val: string): Number {
    return val ? Number(val) : 0;
  }

}
