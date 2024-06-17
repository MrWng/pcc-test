import { Injectable, Inject } from '@angular/core';
import { from, Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { DwUserService } from '@webdpt/framework/user';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { retry } from 'rxjs/operators';
import { format } from 'path';
import { DwFormArray, DwFormControl, DwFormGroup, cloneDeep } from '@athena/dynamic-core';

/**
 * wbs入口
 */
// eslint-disable-next-line no-shadow
export enum Entry {
  // 1: 项目中台 -- 项目计划维护; 2:模版维护 ; 3: 协同计划排定;
  // 代办--项目卡--(wbs计划维护、进度追踪）
  card = 'card',
  // 进度追踪
  progressTrack = 'progressTrack',
  // 基础资料--项目模版维护--wbs计划维护
  maintain = 'maintain',
  // 代办--任务卡--协同任务卡--wbs计划维护
  collaborate = 'collaborate',
  // 代办--任务卡--项目计划--wbs计划维护
  plan = 'plan',
  // 项目变更
  projectChange = 'projectChange',
  // 项目变更签核
  projectChangeSignOff = 'projectChangeSignOff',
  // 项目信息
  projectInfo = 'projectInfo',
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
  dmcUrl: string;
  // 记录机制的content参数
  content: any;
  iamUrl: any;
  mdcUrl: string;
  uploadDmcSettings = {
    dmcUrl: '',
    dirName: 'athena',
    username: 'Athena',
    password: 'Athena',
    bucketName: 'Athena',
  };

  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private userService: DwUserService,
    private translateService: TranslateService,
    protected messageService: NzMessageService
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
    this.configService.get('dmcUrl').subscribe((url) => {
      this.dmcUrl = url;
      this.uploadDmcSettings['dmcUrl'] = url;
    });
    this.configService.get('mdcUrl').subscribe((url) => {
      this.mdcUrl = url;
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
   * 交付设计器.文档同步至知识中台
   * @returns
   */
  getSyncDoc(): Observable<any> {
    const tenantId = this.userService.getUser('tenantId');
    const url = `${this.knowledgeMapsUrl}/service/knowledgegraph/Mechanism/Variable?variableName=syncDoc&tenantId=${tenantId}`;
    return this.http.get(url);
  }

  /**
   * 交付设计器配置
   * @returns
   */
  getMechanismVariableList(params: any[]): Observable<any> {
    const tenantId = this.userService.getUser('tenantId');
    const url = `${this.knowledgeMapsUrl}/service/knowledgegraph/Mechanism/VariableList`;
    return this.http.post(url, {
      map: {
        variableVoList: params,
      },
    });
  }

  /**
   * 获取【交付设计器的参数】
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

  // 获取租户所有职能
  getDutyInfo(): Observable<any> {
    return this.http.get(`${this.eocUrl}/api/eoc/v2/duty`);
  }

  /**
   * 获取任务信息
   */
  getTaskInfo(project_no, source, change_version?): Observable<any> {
    if (source === Entry.projectChange) {
      const params = {
        excluded_already_deleted_task: true,
        project_change_task_detail_info: [
          {
            project_no,
            change_version,
          },
        ],
      };
      return this.getInvData('bm.pisc.project.change.task.detail.get', params);
    } else {
      const params = {
        project_info: [
          {
            control_mode: '1',
            task_property: source === Entry.maintain ? '2' : '1',
            project_no,
          },
        ],
      };
      return this.getInvData('task.info.get', params);
    }
  }

  /**
   * 获取协同任务卡
   */
  getCollaborationCard(project_no): Observable<any> {
    const params = {
      assist_schedule_info: [
        {
          schedule_status: '1',
          project_no,
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
    const paramTemp = cloneDeep(params);
    if (actionId === 'bm.pisc.project.get') {
      // 只要是没有project_no、project_set_no、，就要加上【项目来源】
      if (
        !paramTemp ||
        !paramTemp.project_info ||
        !Object.keys(paramTemp?.project_info[0]).every((item) =>
          ['project_no', 'project_set_no'].includes(item)
        )
      ) {
        const searchInfo = {
          order: paramTemp?.search_info?.length ? paramTemp?.search_info.length : 1,
          search_field: 'project_source',
          search_operator: 'exist',
          search_value: ['1', '4'],
        };
        if (paramTemp?.search_info?.length) {
          const lastCondition = cloneDeep(paramTemp.search_info[paramTemp.search_info.length - 1]);
          const lastConditionTemp = { ...lastCondition, logic: 'and' };
          paramTemp.search_info.splice(-1, 1).push(lastConditionTemp, searchInfo);
        } else {
          paramTemp['search_info'] = [searchInfo];
        }
      }
    }
    const executeContext = this.content?.executeContext;
    const _params = {
      actionId,
      businessUnit: eocMap ? { eoc_company_id: eocMap } : executeContext?.businessUnit, // 传参
      parameter: paramTemp,
      executeContext: executeContext,
    };
    return this.http.post(`${this.atdmUrl}/api/atdm/v1/data/query/by/actionId`, _params, {
      headers: this.getHeader(),
    });
  }

  // 获取角色信息
  queryCatalog(): Observable<any> {
    return this.http.post(
      `${this.iamUrl}/api/iam/v2/role/catalog/query`,
      { id: 'defaultRoleCatalog' },
      {
        headers: this.getHeader(),
      }
    );
  }

  /**
   * 推DTD流程
   * 场景：
   * 项目卡：启动项目
   */
  pushDTDProcessForStartProject(projectNo: string): Observable<any> {
    const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo ?? '{}');
    const { taskWithBacklogData } = this.content?.executeContext ?? {};
    const workitemListItem = taskWithBacklogData?.backlog[0]?.workitemList[0];
    const submit_params = {
      locale: DwUserInfo.acceptLanguage,
      workitemId: workitemListItem?.workitemId,
      performerId: workitemListItem?.performerId,
      processVariables: { project_no: projectNo, assist_schedule_info: [], fromStart: 'Y' },
      dispatchData: [{ project_no: projectNo }],
      comment: '',
    };

    console.log('启动项目，调用submit-dispatch-data：', new Date().toTimeString());
    const url = `${this.taskEngineUrl}/api/task/manual/submit-dispatch-data`;
    return this.http.post(url, submit_params, { headers: this.getHeader() });
  }

  /**
   * 推DTD流程
   * 场景：
   * 母子项目：结案按钮
   * 协同任务卡提交按钮
   *
   */
  pushDTDProcess(projectNo: string, assist_schedule_info: any = []): void {
    const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo ?? '{}');
    const { taskWithBacklogData } = this.content?.executeContext ?? {};
    const workitemListItem = taskWithBacklogData?.backlog[0]?.workitemList[0];
    const submit_params = {
      locale: DwUserInfo.acceptLanguage,
      workitemId: workitemListItem?.workitemId,
      performerId: workitemListItem?.performerId,
      processVariables: { project_no: projectNo, assist_schedule_info },
      dispatchData: [{ project_no: projectNo }],
      comment: '',
    };
    console.log('调用submit-dispatch-data');
    const myDate = new Date();
    const str = myDate.toTimeString();
    console.log(str);
    this.submitDispatchData(submit_params).subscribe((): void => {});
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
  // 推送问题处理相关
  async submitDispatchForQuestion(params: any): Promise<any> {
    const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo ?? '{}');
    const { taskWithBacklogData } = this.content?.executeContext ?? {};
    const workitemListItem = taskWithBacklogData?.backlog[0]?.workitemList[0];
    const submit_params = {
      locale: DwUserInfo.acceptLanguage,
      workitemId: workitemListItem?.workitemId,
      performerId: workitemListItem?.performerId,
      processVariables: params['variables'] || {},
      dispatchData: params['dispatchData'] || [],
      comment: '',
    };

    console.log('调用 submitDispatchForProjectChange begin: ', new Date().toTimeString());
    const url = `${this.taskEngineUrl}/api/task/manual/submit-dispatch-data`;
    return await this.http.post(url, submit_params, { headers: this.getHeader() }).toPromise();
    console.log('调用 submitDispatchForProjectChange end: ', new Date().toTimeString());
  }

  // 推送项目变更任务签核任务卡
  async submitDispatchForProjectChange(params: any): Promise<void> {
    const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo ?? '{}');
    const { taskWithBacklogData } = this.content?.executeContext ?? {};
    const workitemListItem = taskWithBacklogData?.backlog[0]?.workitemList[0];
    const submit_params = {
      locale: DwUserInfo.acceptLanguage,
      workitemId: workitemListItem?.workitemId,
      performerId: workitemListItem?.performerId,
      processVariables: params['variables'] || {},
      dispatchData: params['dispatchData'] || [],
      comment: '',
    };

    console.log('调用 submitDispatchForProjectChange begin: ', new Date().toTimeString());
    const url = `${this.taskEngineUrl}/api/task/manual/submit-dispatch-data`;
    await this.http.post(url, submit_params, { headers: this.getHeader() }).toPromise();
    console.log('调用 submitDispatchForProjectChange end: ', new Date().toTimeString());
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
        const columns = params[i]?.columns
          ? params[i].columns
          : [
            {
              schema: params[i].schema ? params[i].schema : '',
              headerName: params[i].headerName ? params[i].headerName : '',
              level: 0,
              path: params[i].schema ? params[i].schema : '',
            },
          ];
        const column = {
          headerName: params[i].headerName ? params[i].headerName : '',
          level: 0,
          path: 'inquiry',
          operations: [],
          columns: columns,
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
        const columns = params[i]?.columns
          ? params[i].columns
          : [
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
          columns: columns,
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
  getServiceOrchestration(
    param: any,
    serviceComposerId = 'pcc_maintainFirstLevelPlan'
  ): Observable<any> {
    const params = {
      serviceComposerId: serviceComposerId,
      eocMap: {},
      asyncComplete: false,
      tenantId: this.userService.getUser('tenantId'),
      params: param,
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }

  // 发卡流程
  publishTaskCark(
    param: any[],
    projectCode = 'projectCenterConsoleProjectRisk_mainProject',
    variables?: any
  ) {
    const executeContext = this.content.executeContext;
    const url = `${this.taskEngineUrl}/api/project/create`;
    const _params = {
      projectCode: projectCode,
      process_EOC: {},
      variables: variables ?? {},
      dispatchData: param,
      requesterId: 'Athena',
    };
    return this.http.post(url, _params);
  }

  // 发起项目变更，发卡流程
  publishProjectChange(
    param: any[],
    projectCode = 'projectCenterConsoleProjectRisk_mainProject',
    variables: any,
    eocMap?: any
  ) {
    const executeContext = this.content.executeContext;
    const url = `${this.taskEngineUrl}/api/project/create`;
    const _params = {
      projectCode: projectCode,
      process_EOC: { eoc_company_id: eocMap ? eocMap : executeContext.businessUnit.eoc_company_id },
      variables: variables ?? {},
      dispatchData: param,
      requesterId: 'Athena',
    };
    return this.http.post(url, _params);
  }

  /**
   * 字符串转Number
   * @param val 字符串
   * @returns number
   */
  numberFn(val: string): Number {
    return val ? Number(val) : 0;
  }
  // 对象转formGroup
  transformFromGroup(obj: {}) {
    const handler = (o) => {
      const r: any = {};
      Reflect.ownKeys(o).forEach((key) => {
        if (Array.isArray(o[key])) {
          r[key] = new DwFormArray([]);
          o[key].forEach((item) => {
            const t = handler(item);
            r[key].push(new DwFormGroup(t));
          });
        } else {
          r[key] = new DwFormControl(o[key]);
        }
      });
      return r;
    };
    return handler(obj);
  }
  // 对formArray添加数据
  pushFormArray(formArray: DwFormArray, data: any[]) {
    formArray.clear();
    data.forEach((item) => {
      formArray.push(new DwFormGroup(this.transformFromGroup(item)));
    });
  }

  // 任务工作历推算
  taskWorkCalendar(param: any): Observable<any> {
    return this.getInvData('bm.pisc.task.work.calendar.calculate.process', param);
  }

  tableAddrow(dynamicGroup, table, row) {
    (dynamicGroup.get(table) as any)._component.addRows([row]);
  }
  ensureIndexVisible(dynamicGroup, table, number) {
    (dynamicGroup.get(table) as any)._component.gridApi.ensureIndexVisible(number);
  }

  getTaskProportionInfo(source: string, project_no: string, taskInfo?: any): Observable<any> {
    const params = {
      check_type: '1',
      project_info: [{ project_no }],
    };
    // 1.项目；2.项目模版；3.协同
    switch (source) {
      case Entry.card: {
        params.check_type = '1';
        break;
      }
      case Entry.maintain: {
        params.check_type = '2';
        break;
      }
      case Entry.collaborate: {
        params.check_type = '3';
        if (!taskInfo) {
          console.error('任务比重校验缺少关键字');
          return;
        }
        params.project_info[0]['project_no'] = taskInfo?.project_no;
        // 根任务编号 = 当前协同的一级计划编号
        params.project_info[0]['task_no'] = taskInfo?.task_no;
        // 协助排定计划序号
        params.project_info[0]['assist_schedule_seq'] =
          taskInfo['assist_schedule_seq'] ?? taskInfo['teamwork_plan_seq'];
        break;
      }
      case Entry.projectChange: {
        params.check_type = '4';
        if (!taskInfo) {
          console.error('任务比重校验缺少关键字');
          return;
        }
        params.project_info[0]['project_no'] = taskInfo?.project_no;
        // 变更版本
        params.project_info[0]['change_version'] = taskInfo?.change_version;
        break;
      }
      default: {
        break;
      }
    }

    if (!params.project_info[0]['project_no']) {
      console.error('任务比重校验缺少关键字');
      return;
    }
    return this.getInvData('bm.pisc.task.proportion.check', params);
  }

  /**
   * 调用【项目异动检核】
   * @param project_no 项目编号
   * @param check_type_info 检核类型信息 [ check_type ]:['1','2']
   * @param prompt_manner 提⽰⽅式
   * @param task_no 任务编号、根任务编号
   * @returns 返回值
   */
  getProjectChangeStatus(
    project_no: String,
    check_type_info: Array<String>,
    prompt_manner: String = '2',
    task_no?: String
  ): Observable<any> {
    const params = {
      prompt_manner,
      project_info: [
        {
          project_no,
        },
      ],
      check_type_info: [],
    };
    check_type_info.forEach((check_type) => {
      /**
       * 说明：【页面】、[按钮]
       * 适用范围：
       * ------------------------
       * => ⼊参：项⽬编号、检核类型=1.存在未结束的项⽬变更单
       * 提⽰⽅式=2.回参
       * 【项⽬基础信息维护】、【进度追踪】⻚签头部信息，增加显⽰信息：项⽬变更中；[暂停项⽬]；[指定结案]；[结案];
       * ------------------------
       * => ⼊参：项⽬编号、检核类型=1.存在未结束的项⽬变更单；2.项⽬类型启⽤项⽬变更；3.存在未结束的协同排定；4.项⽬已暂停；5.项⽬签核状态签核中
       * 提⽰⽅式=1.回参
       * [...]调用； [+]调用；[所有任务⾃动延展]；
       * 提⽰⽅式=2.回参
       * 【⽂档类型是交付物样板：上传、删除】，校验结果=false.不通过，不可上传；
       * ------------------------
       * =>  ⼊参：项⽬编号、检核类型=1.存在未结束的项⽬变更单；2.项⽬类型启⽤项⽬变更；4.项⽬已暂停；5.项⽬签核状态签核中
       * 提⽰⽅式=1.回参
       * [添加子项]； [新建⼀级计划]；
       * 提⽰⽅式=2.回参
       * 【项⽬基础信息维护】页面栏位管控，所有栏位只读，附件栏位不可删除/上传；【⽂档类型是项⽬附件：上传、删除】，校验结果=false.不通过，不可上传；【参与部⻔⼈员】；
       * ------------------------
       * =>  ⼊参：项⽬编号、检核类型=1.存在未结束的项⽬变更单；4.项⽬已暂停；5.项⽬签核状态签核中
       * 提⽰⽅式=1.回参
       * [协同计划排定]；[转为正式项⽬]
       * ------------------------
       *  =>  ⼊参：项⽬编号、检核类型=1.存在未结束的项⽬变更单；4.项⽬已暂停；
       * 提⽰⽅式=2.回参
       * 【⻛险维护】⻚签按钮管控
       */
      params.check_type_info.push({ check_type });
    });

    if (task_no) {
      /**
       * [添加子项] ⼊参：项⽬编号、检核类型=1.存在未结束的项⽬变更单；2.项⽬类型启⽤项⽬变更；4.项⽬已暂停；5.项⽬签核状态签核中、任务编号=根任务编号、提⽰⽅式=2.回参
       * 【⽂档类型是交付物样板：上传、删除】⼊参：项⽬编号、任务编号=任务编号、检核类型=传⼊1.存在未结束的项⽬变更单；2.项⽬类型启⽤项⽬变更；3.存在未结束的协同排定；4.项⽬已暂停；5.项⽬签核状态签核中、提⽰⽅式=2.回参
       */
      params.project_info[0]['task_no'] = task_no;
    }
    if (!params.project_info[0].project_no || !params.check_type_info.length) {
      this.messageService.warning(this.translateService.instant('dj-pcc-缺少必要参数'));
      return new Observable((observer) => {
        // 手动触发失败状态
        observer.error(this.translateService.instant('dj-pcc-缺少必要参数'));
      });
    }
    return this.getInvData('bm.pisc.project.change.check', params);
  }

  /**
   * 加法
   * @param arg1
   * @param arg2
   * @returns
   */
  accAdd(arg1, arg2) {
    let r1, r2;
    try {
      r1 = arg1.toString().split('.')[1].length;
    } catch (e) {
      r1 = 0;
    }
    try {
      r2 = arg2.toString().split('.')[1].length;
    } catch (e) {
      r2 = 0;
    }
    const m = Math.pow(10, Math.max(r1, r2));
    return (arg1 * m + arg2 * m) / m;
  }

  /**
   * 减法 arg1 - arg2
   * @param arg1 被减数
   * @param arg2 减数
   * @returns
   */
  accSub(arg1, arg2) {
    let r1, r2;
    try {
      r1 = arg1.toString().split('.')[1].length;
    } catch (e) {
      r1 = 0;
    }
    try {
      r2 = arg2.toString().split('.')[1].length;
    } catch (e) {
      r2 = 0;
    }
    const m = Math.pow(10, Math.max(r1, r2));
    // 动态控制精度长度
    const n = r1 >= r2 ? r1 : r2;
    return ((arg1 * m - arg2 * m) / m).toFixed(n);
  }

  /*
   * 乘法
   * @param arg1 乘数1
   * @param arg2 乘数2
   * @returns
   */
  accMul(arg1, arg2): Number {
    let m = 0;
    const s1 = arg1.toString();
    const s2 = arg2.toString();
    try {
      m += s1.split('.')[1].length;
    } catch (e) {}

    try {
      m += s2.split('.')[1].length;
    } catch (e) {}
    return (Number(s1.replace('.', '')) * Number(s2.replace('.', ''))) / Math.pow(10, m);
  }

  /**
   * 除法 arg1 / arg2
   * @param arg1 被除数
   * @param arg2 除数
   * @returns
   */
  accDiv(arg1, arg2): Number {
    let t1 = 0,
      t2 = 0;
    try {
      t1 = arg1.toString().split('.')[1].length;
    } catch (e) {}
    try {
      t2 = arg2.toString().split('.')[1].length;
    } catch (e) {}
    const r1 = Number(arg1.toString().replace('.', ''));
    const r2 = Number(arg2.toString().replace('.', ''));
    return this.accMul(r1 / r2, Math.pow(10, t2 - t1));
  }

  translatePccWord(word: string, interpolateParams?: any) {
    return this.translateService.instant('dj-pcc-' + word, interpolateParams);
  }
  translateDefaultWord(word: string) {
    return this.translateService.instant('dj-default-' + word);
  }

  generationOpenWindowEmployee(option: any = {}) {
    return {
      actionId: 'bm.pisc.project.employee.get',
      apiParams: {
        search_type: '1',
        project_info: [
          {
            project_no: '',
          },
        ],
      },
      operations: {
        useHasNext: false,
        dataKeys: [
          'department_name',
          'department_no',
          'employee_name',
          'employee_no',
          'role_name',
          'role_no',
          'user_id',
        ],
        roleAttention: ['department_name', 'department_no', 'employee_name', 'employee_no'],
        buttons: [
          {
            title: this.translateService.instant('dj-default-确定'),
            actions: [
              {
                category: 'UI',
                backFills: [
                  {
                    valueScript: "selectedObject['employee_no']",
                    key: 'employee_no',
                  },
                  {
                    valueScript: "selectedObject['employee_name']",
                    key: 'employee_name',
                  },
                ],
              },
            ],
          },
        ],
      },
      executeContext: {},
      openWindow2Params: {
        formGroupValue: [],
        callBacK: option.callBacK,
      },
    };
  }

  /**
   * 呼叫T100
   * @param tenantId 租户ID
   * @returns 任务资料异动
   */
  getTenantProductOperationList(tenantId) {
    const _params = {
      tenant_id: tenantId,
      api_name: 'task.data.process',
    };
    const url = `${this.mdcUrl}/restful/standard/mdc/TenantProductOperationList/Get`;
    // 本地开发时使用
    // const url = 'https://mdc-test.apps.digiwincloud.com.cn/restful/standard/mdc/TenantProductOperationList/Get';
    return this.http.post(url, _params);
  }

  fileFormate(fileList: any[], assign = {}) {
    fileList.forEach((file) => {
      file['url'] = `${this.dmcUrl}/api/dmc/v2/file/Athena/share/${file.id}`;
      file['uid'] = file.id;
      file['status'] = 'done';
      file['lastModified'] = new Date(file.create_date).getTime();
      file['upload_user_id'] = this.userService.getUser('userId');
      file['upload_user_name'] = this.userService.getUser('userName');
      Object.keys(assign).forEach((key) => {
        if (!file[key]) {
          file[key] = assign[key];
        }
      });
      return;
    });
    return fileList;
  }

  /**
   * 项目任务卡
   * @param projectNumber 项目编号
   */
  checkTask(
    project_no: string,
    project_template_no: string,
    source,
    task_property?: string
  ): Observable<any> {
    const params = {
      project_info: [
        {
          control_mode: '1',
          task_property: source === Entry.maintain || task_property ? '2' : '1',
          project_no: project_template_no ? project_template_no : project_no,
        },
      ],
    };
    return this.getInvData('task.info.get', params);
  }

  /**
   * 获取任务卡依赖关系
   * @param projectNumber
   * @returns
   */
  getDependencyInfo(project_no: string, source?: string): Observable<any> {
    const params = {
      project_info: [
        {
          project_no: project_no,
          task_property: source === Entry.maintain ? '2' : '1',
        },
      ],
    };
    return this.getInvData('project.task.dependency.info.get', params);
  }
}
