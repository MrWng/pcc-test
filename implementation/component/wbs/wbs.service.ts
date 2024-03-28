import { Inject, Injectable } from '@angular/core';
import { DwLanguageService } from '@webdpt/framework/language';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { forkJoin, Observable, Subject } from 'rxjs';
import { HttpClient, HttpRequest } from '@angular/common/http';
import * as moment from 'moment';
import { DragDropService } from '../../directive/dragdrop/dragdrop.service';
import { CommonService, Entry } from '../../service/common.service';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DwUserService } from '@webdpt/framework/user';
import { cloneDeep, DynamicUserBehaviorCommService, isEmpty } from '@athena/dynamic-core';
import { DynamicCustomizedService } from 'app/implementation/service/dynamic-customized.service';

@Injectable()
export class DynamicWbsService {
  aimUrl: string;
  audcUrl: string;
  atmcUrl: string;
  eocUrl: string;
  smartDataUrl: string;
  taskEngineUrl: string;
  knowledgeMapsUrl: string;
  mdcUrl: string;
  taskDetail: any;
  // 使用者model
  userModel;
  group: any;

  /** 项目编号 */
  project_no: string = '';
  /** 项目信息 需要定义类型 */
  projectInfo: any = {};
  /**
   * 风险维护用的项目信息
   * 为了处理projectInfo数据可能会被篡改
   * */
  riskMaintenanceProjectInfo: any = {};
  /** 定制页的type，this.model.type */
  modelType: string = '';
  /** 新建一级计划弹窗的开关 true:显示，false：隐藏 */
  // firstPlanSwitch: boolean = false;
  /** 页面转化成树形结构的数据，方便各个组件取用 */
  pageDatas: Array<any> = [];

  /** 开始时间 & 结束时间 用于人力资源负荷 */
  dateObject = {
    /** 开始时间 */
    startDate: '',
    /** 结束时间 */
    endDate: '',
  };
  /** 是否启动地端 */
  hasGroundEnd: any;
  // 是否同步文档
  is_sync_document = false;
  useTaskTemplate: boolean = false;
  peopleObject = {
    list: [],
    name: '',
  };
  pageChange = new Subject();
  $newCardInfo = new Subject();
  $useTaskTemplateStatus = new Subject();
  $checkProportion = new Subject();
  changeWbs$ = new Subject();

  // 项⽬变更状态，false，存在【项目变更中】
  projectChangeStatus: Object = {
    check_type_init: true,
    check_type_risk: true,
    check_type_list: true,
    // 用于基础维护信息，表格栏位管控
    check_type_creation: true,
  };
  $projectChangeStatusSubscribe = new Subject();

  // 是否可编辑：项目卡负责人和当前租户是同一人&&不是历史任务
  editable: boolean = true;
  // 是否展示专案模板维护
  isTrackPages: boolean = false;
  pageDatasTask: Array<any>;
  // 所有任务卡信息
  allTaskCardList: Array<any>;
  // 可以被协同的一级任务
  firstTaskCardList: any[] = [];
  // 协同任务卡代理人和当前登陆用户是否同一个人
  collaborateAgentIdSameUserId: boolean = false;
  // 显示人力资源负荷
  showHRLoad: boolean = false;
  fullScreenStatus: boolean = false;
  showGantt: boolean = false;
  showPert: boolean = false;

  ganttData: any;

  showExcel: boolean = false;
  needRefresh = '';
  TaskType = {
    ORD: this.translateService.instant('dj-pcc-一般'), // 手动任务
    MO: this.translateService.instant('dj-pcc-生产'), // 工单任务
    PO: this.translateService.instant('dj-pcc-采购'), // 采购任务
    OD: this.translateService.instant('dj-pcc-订单'), // 订单任务
    ODAR: this.translateService.instant('dj-pcc-订单账款分期'), // 订单账款分期 /账款分期
    MOOP: this.translateService.instant('dj-pcc-工单制程'), // 工单工艺任务
    EXPORT: this.translateService.instant('dj-pcc-出货通知单'), // 出货通知单
    SHIPMENT: this.translateService.instant('dj-pcc-出货单'), // 出货单任务
    MES: this.translateService.instant('dj-pcc-MES'), // MES
    PR: this.translateService.instant('dj-pcc-请购'), // 请购任务
    PRSUM: this.translateService.instant('dj-pcc-请购（汇总）'), // 请购汇总
    POSUM: this.translateService.instant('dj-pcc-采购（汇总）'), // 采购汇总
    MO_H: this.translateService.instant('dj-pcc-工单（工时）'), // 工单（工时）
    REVIEW: this.translateService.instant('dj-pcc-项目检讨'), // 项目检讨
    POPUR: this.translateService.instant('dj-pcc-采购进货明细'), // 采购进货明细
    PLM_PROJECT: this.translateService.instant('dj-pcc-PLM项目'), // PLM项目
    PLM: this.translateService.instant('dj-pcc-PLM'), // PLM
    SFT: this.translateService.instant('dj-pcc-SFT'), // SFT任务
    APC: this.translateService.instant('dj-pcc-APC'),
    APC_O: this.translateService.instant('dj-pcc-APC_O'),
    MOMA: this.translateService.instant('dj-pcc-MOMA'), // 工单发料任务
    PO_KEY: this.translateService.instant('dj-pcc-PO_KEY'), // 采购关键料任务
    ASSC_ISA_ORDER: this.translateService.instant('dj-pcc-ASSC_ISA_ORDER'), // 售后云安调工单
    PCM: this.translateService.instant('dj-pcc-PCM'), // 项目预算编制
    PO_NOT_KEY: this.translateService.instant('dj-pcc-PO_NOT_KEY'), // 采购非关键料任务
  };

  initWbsShow = new Subject();

  // 任务比重校验
  taskProportionCheck: any = {};

  // 是否存在协同计划排定任务卡
  hasCollaborationCard: boolean = false;
  // 登陆员工信息
  userInfo: any;

  // 项目变更信息
  projectChangeDoc: any = {};

  // 项目变更版本
  change_version;

  // 变更签核版本
  change_approve_version;
  // wbs展现形式
  typeChange: string = 'card';

  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private languageService: DwLanguageService,
    protected commonService: CommonService,
    private messageService: NzMessageService,
    private translateService: TranslateService,
    private userService: DwUserService,
    private dynamicUserBehaviorCommService: DynamicUserBehaviorCommService,
    private dynamicCustomizedService: DynamicCustomizedService
  ) {
    this.configService.get('audcUrl').subscribe((url) => {
      this.audcUrl = url;
    });
    this.configService.get('atmcUrl').subscribe((url: string) => {
      this.atmcUrl = url;
    });
    this.configService.get('eocUrl').subscribe((url: string): void => {
      this.eocUrl = url;
    });
    this.configService.get('aimUrl').subscribe((url: string): void => {
      this.aimUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
    this.configService.get('knowledgeMapsUrl').subscribe((url: string): void => {
      this.knowledgeMapsUrl = url;
    });
    this.configService.get('taskEngineUrl').subscribe((url) => {
      this.taskEngineUrl = url;
    });
    this.configService.get('mdcUrl').subscribe((url) => {
      this.mdcUrl = url;
    });
  }

  /**
   *  项目扩展信息检查
   *  依据项目编号，比较操作时间和当前系统时间，返回当前项目是否可操作否
   * @param project_no 项目编号
   * @returns
   */
  getInfoCheck(project_no: any): Observable<any> {
    return this.commonService.getInvData('project.expand.info.check', { project_no });
  }

  changeType(type) {
    this.typeChange = type;
  }

  checkReviewTaskPlanned(variableName: any, tenantId: any): Observable<any> {
    const url = `${this.knowledgeMapsUrl}/knowledgegraph/Mechanism/Variable?variableName=${variableName}&tenantId=${tenantId}`;
    return this.http.get(url);
  }

  async setCollaborateAgentIdSameUserId(): Promise<any> {
    this.collaborateAgentIdSameUserId = false;
    const performerId =
      this.dynamicUserBehaviorCommService.commData?.workContent?.performerId ?? 'wfgp001';
    const apis = [
      this.commonService.searchUserInfo({ userId: this.userService.getUser('userId') }).toPromise(),
      this.commonService.getAgentInfo({ userId: performerId }).toPromise(),
    ];
    const value = await Promise.all(apis).then((responses) =>
      responses.map((item): any => item.data)
    );
    this.userInfo = value[0];
    if (value[0].id === value[1].agentId && this.pageDatas.length) {
      this.collaborateAgentIdSameUserId = true;
      return;
    }
    this.collaborateAgentIdSameUserId = false;
  }

  /**
   * 校验变更中是否可用
   */
  async checkChangeForbidden(task_no): Promise<any> {
    const res1 = await this.commonService
      .getInvData(
        'bm.pisc.project.change.doc.get',
        {
          project_change_doc_info: [
            {
              project_no: this.project_no,
              change_version: this.change_version,
            },
          ],
        },
        this.projectInfo.eoc_company_id
      )
      .toPromise();
    const res2 = await this.commonService
      .getInvData(
        'bm.pisc.project.change.task.detail.get',
        {
          excluded_already_deleted_task: true,
          project_change_task_detail_info: [
            {
              project_no: this.project_no,
              change_version: this.change_version,
              task_no,
            },
          ],
        },
        this.projectInfo.eoc_company_id
      )
      .toPromise();
    return {
      change_status: res1?.data?.project_change_doc_info[0].change_status,
      old_task_status: res2?.data?.project_change_task_detail_info[0].old_task_status,
    };
  }

  /**
   * 项目任务卡
   * @param projectNumber 项目编号
   */
  checkTask(project_template_no: string, source, task_property?: string): Observable<any> {
    const params = {
      project_info: [
        {
          control_mode: '1',
          task_property: source === Entry.maintain || task_property ? '2' : '1',
          project_no: project_template_no ? project_template_no : this.project_no,
        },
      ],
    };
    return this.commonService.getInvData('task.info.get', params);
  }

  /**
   * 获取任务卡依赖关系
   * @param projectNumber
   * @returns
   */

  getDependencyInfo(source?: string): Observable<any> {
    const params = {
      project_info: [
        {
          project_no: this.project_no,
          task_property: source === Entry.maintain ? '2' : '1',
        },
      ],
    };
    return this.commonService.getInvData('project.task.dependency.info.get', params);
  }

  /**
   * 通知执行人
   * @param params
   */
  searchEmployeeId(params: any): Observable<any> {
    const url = `${this.eocUrl}/api/eoc/v2/emp/user/id`;
    return this.http.post(url, params);
  }

  /**
   * 通知执行人
   * @param params
   */
  pushMessage(params: any): Observable<any> {
    const url = `${this.atmcUrl}/api/atmc/v1/backlog/notice/no/backlog`;
    return this.http.post(url, params);
  }

  pushNewMessage(params: any): Observable<any> {
    const url = `${this.aimUrl}/api/aim/v1/message`;
    return this.http.post(url, params);
  }

  /**
   *推送流程
   *
   */
  postProcess(tenantId, params: any, content: any): Observable<any> {
    const executeContext = content.executeContext;
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

  // 结案流程
  postProcessNew(locale, requesterId, params: any, content: any): Observable<any> {
    const executeContext = content.executeContext;
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

  postContinueProcess(tenantId, params: any, content: any): Observable<any> {
    const executeContext = content.executeContext;
    const _params = {
      tenantId,
      actionId: 'startSC_Start_ProjectCenterConsole_ResetTaskTime',
      paras: params,
      eocMap: {
        eoc_company_id: executeContext.businessUnit.eoc_company_id,
      },
    };
    const url = `${this.smartDataUrl}/ExecutionEngine/execute`;
    return this.http.post(url, _params);
  }

  postContinueProcessNew(locale, requesterId, params: any, content: any): Observable<any> {
    const executeContext = content.executeContext;
    const _params = {
      projectCode: 'projectCenterConsole_resetTaskTime_mainProject',
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

  postCollaborativePlanProcess(tenantId, params: any, content: any): Observable<any> {
    const executeContext = content.executeContext;
    const _params = {
      tenantId,
      actionId: 'startSC_Start_ProjectCenterConsole_CoordinationPlanArrange',
      paras: params,
      eocMap: {
        eoc_company_id: executeContext.businessUnit.eoc_company_id,
      },
    };
    const url = `${this.smartDataUrl}/ExecutionEngine/execute`;
    return this.http.post(url, _params);
  }

  postCollaborativePlanProcessNew(locale, requesterId, params: any, content: any): Observable<any> {
    const executeContext = content.executeContext;
    const _params = {
      projectCode: 'projectCenterConsole_CoordinationPlanArrange_mainProject',
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

  suspendOrStopProject(
    requesterId,
    variablesType: string,
    isSign: boolean,
    project_info: any,
    dispatchData: any,
    extraInfo?: any
  ): Observable<any> {
    const executeContext = this.commonService.content?.executeContext;
    const _params = {
      projectCode: 'projectCenterConsoleStopProject_mainProject',
      process_EOC: { eoc_company_id: executeContext.businessUnit.eoc_company_id },
      variables: {
        type: variablesType, // 调用流程的动作标识
        isSign, // 是否签核
        project_info,
        ...extraInfo,
      },
      dispatchData,
      requesterId,
    };
    const url = `${this.taskEngineUrl}/api/project/create`;
    return this.http.post(url, _params);
  }

  // 项目暂停 - 清理协同卡
  suspendCard(project_no: string, asyncComplete: boolean = true): Observable<any> {
    const params = {
      serviceComposerId: 'pcc_closeTeamWork',
      eocMap: {},
      asyncComplete,
      tenantId: this.userService.getUser('tenantId'),
      params: {
        projectArr: [{ project_no: project_no }],
      },
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }

  changeProjectCloseTeamWork(project_no: string): Observable<any> {
    const params = {
      serviceComposerId: 'pcc_closeTeamWork',
      eocMap: {},
      asyncComplete: true,
      tenantId: this.userService.getUser('tenantId'),
      params: {
        projectArr: [{ project_no: project_no }],
        type: 'changeProject',
      },
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }

  // 关闭项目风险
  closeProjectRisk(project_no: string): Observable<any> {
    const params = {
      serviceComposerId: 'pcc_closeProjectRisk',
      eocMap: {},
      asyncComplete: true,
      tenantId: this.userService.getUser('tenantId'),
      params: {
        projectArr: [{ project_no: project_no }],
      },
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }

  // 项目删除
  deleteCard2(project_no: string, teamWorkInfo: any): Observable<any> {
    // teamWorkInfo = [{
    //   "assist_schedule_seq":1,
    //   "project_no":"23422233333444420230725001-",
    //   "task_no":"1",
    //   "plan_finish_date":"2023-08-03",
    //   "dispatch_date":"2023-08-01",
    //   "plan_days":2,
    //   "responsible_person_no":"ware001_1",
    //   "responsible_person_name":"ERP仓管员1",
    //   "dispatch_status":"2",
    //   "schedule_status":"2",
    //   "remark":"",
    //   "manage_status":"Y",
    //   "task_name":"AA",
    //   "project_name":"测试项目层级码01",
    //   "project_leader_no":"ware001_1",
    //   "project_leader_name":"ERP仓管员1"
    // }]
    const params = {
      serviceComposerId: 'pcc_closeTeamWork',
      eocMap: {},
      asyncComplete: false,
      tenantId: this.userService.getUser('tenantId'),
      params: {
        projectArr: [
          {
            project_no: project_no,
          },
        ],
        teamWorkInfo: teamWorkInfo,
        type: 'deleteProject',
      },
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }

  // 项目删除
  deleteCard(project_no: string): Observable<any> {
    const params = {
      serviceComposerId: 'pcc_closeProjectNotStart',
      eocMap: {},
      asyncComplete: false,
      tenantId: this.userService.getUser('tenantId'),
      params: {
        projectArr: [{ project_no: project_no }],
      },
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }

  // 项目删除后，撤销【我的项目】里的项目卡
  cancelCard(project_no: string): Observable<any> {
    const params = {
      serviceComposerId: 'pcc_closeMainProject',
      eocMap: {},
      asyncComplete: false,
      tenantId: this.userService.getUser('tenantId'),
      params: {
        projectArr: [{ project_no: project_no }],
      },
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }

  // 删除项目变更任务
  closeProjectChange(project_no: string, change_version): Observable<any> {
    const params = {
      serviceComposerId: 'pcc_close_project_change',
      eocMap: {},
      asyncComplete: true,
      tenantId: this.userService.getUser('tenantId'),
      params: {
        project_change_doc_info: [{ project_no: project_no, change_version }],
      },
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }

  // 回收计划时程异常任务卡和计划时程异常项目卡
  closePlanChangeManual(project_no: string, asyncComplete: boolean = true): Observable<any> {
    const params = {
      serviceComposerId: 'pcc_closePlanChange_manual',
      eocMap: {},
      asyncComplete,
      tenantId: this.userService.getUser('tenantId'),
      params: {
        projectArr: [{ project_no: project_no }],
      },
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }

  /**
   * 回收怠工处理异常相关任务卡和项目卡
   * @param project_no
   * @param type 默认：projectChange（发起项目变更），其它：projectStatusChange（暂停项目）
   * @param asyncComplete 异步/同步
   * @returns
   */
  finishTaskThenCheckGoSlowTask(
    project_no: string,
    type: string = 'projectChange',
    asyncComplete: boolean = true
  ): Observable<any> {
    const params = {
      serviceComposerId: 'pcc_finishTaskThenCheckGoSlowTask',
      eocMap: {},
      asyncComplete,
      tenantId: this.userService.getUser('tenantId'),
      params: {
        type,
        projectArr: [{ project_no: project_no }],
      },
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }

  intercept(req: HttpRequest<any>): HttpRequest<any> {
    if (this.languageService && this.languageService.currentLanguage) {
      req = req.clone({
        setHeaders: {
          locale: this.languageService.currentLanguage,
        },
      });
    }
    if (this.authToken?.token) {
      req = req.clone({
        setHeaders: {
          'digi-middleware-auth-user': this.authToken.token,
          token: this.authToken.token,
        },
      });
    }
    req = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
      },
    });
    return req;
  }

  /*
   * 获取项目周期（开始时间-截止时间）
   * @param startT:项目开始时间
   * @param endT:项目截止时间
   * @return 项目周期
   */
  getPjPeriod(startT: string, endT: string): string {
    try {
      if (startT && endT) {
        const startDate = new Date(startT),
          endDate = new Date(endT),
          start = `${startDate.getFullYear()}/${(startDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}/${startDate.getDate().toString().padStart(2, '0')}`,
          endYear =
            startDate.getFullYear() === endDate.getFullYear() ? '' : `${endDate.getFullYear()}/`,
          end = `${endYear}${(endDate.getMonth() + 1).toString().padStart(2, '0')}/${endDate
            .getDate()
            .toString()
            .padStart(2, '0')}`;
        return `${start}-${end}`;
      }
    } catch (err) {
      return `xxxx.xx.xx-xx.xx`;
    }
  }

  /**
   * 工期计算
   * @param item 卡片信息
   * @returns 工期
   */
  durationCalculation(item): number {
    let diff = 0;
    if (item.plan_finish_date && item.plan_start_date) {
      diff = moment(item.plan_finish_date).diff(moment(item.plan_start_date), 'days') + 1;
    }
    return diff;
  }

  /**
   * 逾期计算
   * @param item 卡片信息
   * @returns 工时
   */
  overdueDays(item): boolean {
    let finishDiff, finishDiffNum;
    if (
      (item.task_status === 20 ||
        item.task_status === 10 ||
        item.task_status === 30 ||
        item.task_status === 60) &&
      item.plan_finish_date
    ) {
      const planFinishDate = moment(new Date(item.plan_finish_date + ' 23:59:59'));
      const actualFinishDate = item.actual_finish_date
        ? moment(new Date(item.actual_finish_date + ' 23:59:59'))
        : moment(new Date());
      if (actualFinishDate.diff(planFinishDate, 'minutes') > 59) {
        if (actualFinishDate.diff(planFinishDate, 'hours') > 24) {
          finishDiff = actualFinishDate.diff(planFinishDate, 'days');
        }
      }
      finishDiffNum = actualFinishDate.diff(planFinishDate, 'minutes');
      finishDiff =
        actualFinishDate.diff(planFinishDate, 'minutes') < 60
          ? actualFinishDate.diff(planFinishDate, 'minutes') +
            this.translateService.instant('dj-c-分钟')
          : actualFinishDate.diff(planFinishDate, 'hours') < 24
          ? actualFinishDate.diff(planFinishDate, 'hours') +
            this.translateService.instant('dj-c-时')
          : actualFinishDate.diff(planFinishDate, 'days') > 0
          ? actualFinishDate.diff(planFinishDate, 'days') + this.translateService.instant('dj-c-天')
          : '';
    }
    if (finishDiffNum > 0) {
      return finishDiff;
    }
  }

  getChildrenLength(datas, item): number {
    let length = 0;
    const expanded = (data, isChildrenshow) => {
      if (isChildrenshow && data && data.length > 0) {
        length += data.length;
        data.forEach((e) => {
          expanded(e.children, e.isChildrenshow);
        });
      }
    };
    expanded(datas, item.isChildrenshow);
    return length;
  }

  /**
   *
   * @param data 计算子卡的数量，方便计算连线高度
   */
  calculationChildrenLength(data) {
    data.forEach((item) => {
      if (item.children && item.children.length) {
        if (item.children.length > 1) {
          item.chilrenLength =
            this.getChildrenLength(item.children.slice(0, item.children.length - 1), item) + 1;
        } else {
          item.chilrenLength = item.children.length;
        }

        this.calculationChildrenLength(item.children);
      }
    });
  }

  /**
   *
   * @param data 卡片层级，方便计算卡片宽度
   * @param level
   */
  cardLevelHandle(data: Array<any>, level: number) {
    data.forEach((item) => {
      if (item.children) {
        this.cardLevelHandle(item.children, level + 1);
        item.level = level;
      }
    });
  }

  /**
   *
   * @param cardList 点击新增时寻找当前甬道
   * @param card
   * @returns
   */
  findFirstParentCard(cardList, card): boolean {
    let isFind = false;
    for (let i = 0; i < cardList.length; i++) {
      const item = cardList[i];
      if (item.task_no === card.task_no) {
        isFind = true;
        break;
      }
      if (!isFind && item.children && item.children.length) {
        isFind = this.findFirstParentCard(item.children, card);
      }
    }
    return isFind;
  }

  /**
   * 寻找当前甬道数据
   * @param currentCardInfo
   */
  getCurrentCorridor(currentCardInfo) {
    let corridorData = {};
    for (let i = 0; i < this.pageDatas.length; i++) {
      const item = this.pageDatas[i];
      if (item.task_no === currentCardInfo.task_no) {
        corridorData = item;
        break;
      } else {
        if (item.children && item.children.length) {
          if (this.findFirstParentCard(item.children, currentCardInfo)) {
            corridorData = item;
            break;
          }
        }
      }
    }

    return corridorData;
  }

  /**
   * 拉平数据
   */
  structureTransform(taskInfo, newTaskInfo, rootTaskNo) {
    if (taskInfo.children && taskInfo.children.length > 0) {
      taskInfo.children.forEach((task) => {
        this.structureTransform(task, newTaskInfo, rootTaskNo);
      });
    }
    taskInfo.root_task_no = rootTaskNo;
    newTaskInfo.push(taskInfo);
  }

  /**
   *
   * @param e 拖拽时
   * @param target
   * @param index
   */
  onDrop(e: DragDropService, target, fun, source, index?): void {
    const item = e.dragData.item;
    const saveMoveItemInfo = cloneDeep(item);
    const parent = e.dragData.parentList;
    const indexOfParent = e.dragData.index;
    const positionType = e.positionType; //
    /** drop的位置在列表的index */
    const dropIndex = e.dropIndex;
    /** drag元素在原来的列表的index，注意使用虚拟滚动数据无效 */
    const fromIndex = e.dragFromIndex;
    const changeList = target.children !== parent;
    if (target.children === parent && dropIndex > fromIndex) {
      index--;
    }
    const fromList = parent.map((o: any): any => {
      return o;
    });
    let task_no, toList;
    if (index !== undefined) {
      task_no = target.task_no;
      toList = target.children;
    } else {
      if (dropIndex < target.children.length) {
        task_no = e.positionType === 0 ? target.children[dropIndex].task_no : target.task_no;
        toList = target.children[dropIndex].children;
      } else {
        task_no = target.task_no;
        toList = [];
      }
    }
    toList = (toList || []).map((o: any): any => {
      return o;
    });
    let firstList = [];
    // 判断脱拽目标是否是一级目录 是获取除自己本身所有一级并重排sequence
    if (
      fromList[0].upper_level_task_no === fromList[0].task_no ||
      !fromList[0].upper_level_task_no
    ) {
      firstList = this.getFirstList(fromList[0].task_no);
    }
    this.buildList(fromList, toList, indexOfParent, index, task_no);
    const targetChildrenList = e.positionType === 0 ? toList : target.children;
    if (
      targetChildrenList &&
      targetChildrenList[0].upper_level_task_no === targetChildrenList[0].task_no
    ) {
      targetChildrenList[0].upper_level_task_no = saveMoveItemInfo.upper_level_task_no;
    }
    const toSecList = this.getSecList(item, dropIndex, targetChildrenList, toList);
    let task_info;
    if (toSecList.isParent) {
      task_info = [...toSecList.newList, ...firstList];
    } else {
      task_info = [...fromList, ...toSecList.newList, ...firstList];
    }
    let url = 'task.base.info.update';
    let paramser = {
      task_info: task_info.map((o) => {
        o.is_update_upper_date = 'Y';
        o.task_status = String(o.task_status);
        o.task_property = source === Entry.maintain ? '2' : '1';
        o.doc_type_info = o.doc_condition_value.split(',').map((i) => {
          return { doc_condition_value: i };
        });
        return o;
      }),
    };
    if (source === Entry.projectChange) {
      url = 'bm.pisc.project.change.task.detail.update';
      const newTaskInfo = [];
      task_info.forEach((task) => {
        this.structureTransform(task, newTaskInfo, task.root_task_no);
      });
      paramser = {
        // @ts-ignore
        sync_steady_state: this.hasGroundEnd !== 'Y' ? null : 'Y',
        is_update_task_date: true,
        is_check_task_dependency: false,
        project_change_task_detail_info: newTaskInfo.map((o) => {
          o.plan_work_hours = o.plan_work_hours === '' ? 0 : o.plan_work_hours;
          o.is_update_upper_date = 'Y';
          o.task_status = String(o.task_status);
          o.doc_type_info = o.doc_condition_value.split(',').map((i) => {
            return { doc_condition_value: i };
          });
          return o;
        }),
      };
    }
    // 源数组移除
    this.commonService.getInvData(url, paramser).subscribe((res) => {
      if (source !== Entry.projectChange) {
        if (res.data.task_info[0]?.project_no_mistake_message) {
          this.messageService.error(res.data.task_info[0]?.project_no_mistake_message);
          return;
        }
      }
      this.pageChange.next(true);
      this.$checkProportion.next(true);
      // 删除源数据列表数据并对数组进行重新编号
      parent.splice(indexOfParent, 1).forEach((o, i): void => {
        o.sequence = i + 1;
      });
      // 插入
      if (e.positionType === 0) {
        if (index !== undefined) {
          target.children = target.children || [];
          target.children.push(Object.assign(item, { upper_level_task_no: target.task_no }));
        } else {
          if (target.children && dropIndex < target.children.length) {
            target.children[dropIndex].children = target.children[dropIndex].children || [];
            target.children[dropIndex].children.push(
              Object.assign(item, { upper_level_task_no: target.task_no })
            );
          } else {
            target.children = target.children || [];
            target.children.push(Object.assign(item, { upper_level_task_no: target.task_no }));
          }
        }
      } else {
        target.children
          .splice(dropIndex, 0, Object.assign(item, { upper_level_task_no: target.task_no }))
          .forEach((o, i): void => {
            o.sequence = i + 1;
          });
      }
      if (item.level === 0) {
        this.pageDatas.forEach((currentData: any, index2: number): void => {
          if (currentData.task_no === item.task_no) {
            this.pageDatas.splice(index2, 1);
          }
        });
      }
      this.cardLevelHandle(this.pageDatas, 0);
      this.calculationChildrenLength(this.pageDatas);
      fun();
      // 同步知识中台
      if (source === Entry.card && this.is_sync_document) {
        const params = { project_info: [{ project_no: this.project_no }] };
        this.commonService.getInvData('bm.pisc.project.get', params).subscribe((res: any): void => {
          const status = res.data.project_info[0].project_status;
          if (status === '30') {
            const params = { data_type: '0', project_info: [{ project_no: this.project_no }] };
            this.commonService
              .getInvData('document.info.sync.process', params)
              .subscribe((res: any): void => {});
          }
        });
      }
    });
  }
  buildList(
    fromList: Array<any>,
    toList: Array<any>,
    fromIndex: number,
    toIndex: number,
    parentNo: string
  ): void {
    const item = fromList.splice(fromIndex, 1);
    fromList.forEach((o, i): void => {
      o.sequence = i + 1;
    });
    toList.splice(toIndex || 0, 0, Object.assign({}, item[0], { upper_level_task_no: parentNo }));
  }

  getFirstList(task_no) {
    const pages = [];
    let i = 1;
    this.pageDatas.forEach((o) => {
      if (o.task_no !== task_no) {
        o.sequence = i++;
        pages.push(o);
      }
    });
    return pages;
  }

  getSecList(item, index, list, toList) {
    const newList = JSON.parse(JSON.stringify(list));
    const arr = [];
    let isParent = false;
    // 判断是否拖拽在自己同级范围内 如果是删除自身
    newList.forEach((res, i) => {
      if (res.upper_level_task_no === item.upper_level_task_no && res.task_no === item.task_no) {
        newList.splice(i, 1);
        isParent = true;
      }
    });
    // 获取拖拽已修改父级的目标对象
    toList.forEach((res) => {
      if (item.task_no === res.task_no) {
        arr.push(res);
      }
    });
    // 将拖拽目标对象放入拖拽到的children中并重排sequence
    newList.splice(index, 0, arr[0]);
    const newList2 = new Array(newList[0]);
    newList2.forEach((task, num) => {
      newList.forEach((res, index2) => {
        if (
          !(
            res?.task_no === task?.task_no && res?.upper_level_task_no === task?.upper_level_task_no
          )
        ) {
          newList2.push(res);
        }
      });
    });
    newList2.forEach((res, index2) => {
      res.sequence = index2 + 1;
    });
    const arr1 = {
      newList: newList2,
      isParent: isParent,
    };
    return arr1;
  }

  parentId(arr, task_no) {
    // 获取最顶级id
    let temp;
    const callback = function (nowArr, task_no2) {
      for (let i = 0; i < nowArr.length; i++) {
        const item = nowArr[i];
        if (item.task_no === task_no2) {
          if (item.upper_level_task_no && item.upper_level_task_no !== item.task_no) {
            callback(arr, item.upper_level_task_no); // pid 父级ID
          } else {
            temp = item.task_no;
          }
          break;
        }
      }
    };
    callback(arr, task_no);
    return temp;
  }

  parentTree(arr, task_no) {
    // arr 所有的树数据 id 某个子节点的id
    const temp = [];
    const callback = function (nowArr, task_no2) {
      for (let i = 0; i < nowArr.length; i++) {
        const item = nowArr[i];
        if (item.task_no === task_no2) {
          temp.push(task_no2);
          if (item.upper_level_task_no && item.upper_level_task_no !== item.task_no) {
            callback(arr, item.upper_level_task_no); // pid 父级ID
          }
          break;
        }
      }
    };
    callback(arr, task_no);
    return temp;
  }

  postAccessible() {
    const _params = [
      {
        category: 1,
        type: 'athena-basicDataEntry',
        tmActivityIdList: ['projectTemplate'],
      },
    ];
    const url = `${this.audcUrl}/api/audc/v1/check/activity/accessible`;
    return this.http.post(url, _params);
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

  /**
   * 递归方法：采集一组任务集合的任务编号集合
   * @param children 一组任务集合
   * @param array 返回一组任务编号集合
   */
  getOneGroupTaskNo(children, array) {
    if (children) {
      array.push(children.task_no);
      if (children.children && children.children.length) {
        children.children.forEach((v) => {
          this.getOneGroupTaskNo(v, array);
        });
      }
    }
  }

  /**
   * 调用递归：查找当前项目中，所有分组任务的任务编号集合
   * 1、taskNo，有值的时候，返回当前所在组的任务编号集合
   * 2、taskNo，不传的时候，返回所有分组任务的任务编号集合
   * @param taskNo 想要查找的所在组的任务编号
   * @returns 返回所有分组任务的任务编号集合/当前所在组的任务编号集合
   */
  getAllGroupTaskNo(taskNo?: string): Array<any> {
    let arrNos = [];

    this.pageDatas.forEach((item) => {
      const arrNo = [];
      this.getOneGroupTaskNo(item, arrNo);
      arrNos.push(arrNo);
    });

    if (taskNo && arrNos.length) {
      for (let i = 0; i < arrNos.length; i++) {
        if (arrNos[i].find((item) => item === taskNo)) {
          arrNos = arrNos[i];
          break;
        }
      }
    }
    return arrNos;
  }

  /**
   * 递归方法：查找的父节点的所有子节点
   * @param children  一组任务集合
   * @param task_no 查找的父节点
   * @param finder 查找的父节点的所有子节点
   */
  getTaskChildren(children, task_no, finder) {
    if (children) {
      if (children.task_no === task_no) {
        finder.push(children.children);
      }
      if (children.children.length) {
        children.children.forEach((v) => {
          this.getTaskChildren(v, task_no, finder);
        });
      }
    }
  }

  /**
   * 调用递归：查找的父节点的所有子节点
   * @param children  一组任务集合
   * @param task_no 查找的父节点
   * @param finder 查找的父节点的所有子节点
   */
  findChildrenTaskInfo(taskNo?: string): Array<any> {
    const finder = [];
    for (let i = 0; i < this.pageDatas.length; i++) {
      this.getTaskChildren(this.pageDatas[i], taskNo, finder);
      if (finder && finder.length) {
        break;
      }
    }
    return finder && finder.length ? finder[0] : null;
  }

  /**
   * 调用递归：树形结构集合的所有对象的task_no
   * @param treeList 树形结构集合
   * @returns 所有对象的task_no
   */
  getTreeTaskNo(treeList): Array<any> {
    const arrNos = [];
    treeList.forEach((item) => {
      const arrNo = [];
      this.getOneGroupTaskNo(item, arrNo);
      arrNos.push(...arrNo);
    });
    return arrNos;
  }

  /**
   * 递归方法：子项开窗，修改前后置任务，点击取消，数据还原
   * @param children 一组任务集合
   * @param task 任务卡片原始数据
   */
  getTaskForEdit(children, task) {
    if (children) {
      if (children.task_no === task.task_no) {
        children.task_dependency_info = task.task_dependency_info;
      }
      if (children.children && children.children.length) {
        children.children.forEach((v) => {
          this.getTaskForEdit(v, task);
        });
      }
    }
  }

  /**
   * 递归方法：查找的父节点的所有子节点中是否有满足条件集合
   * @param children 对象{}，一组任务信息的集合
   * @param key 查找的节点对象的属性
   * @param value 查找的节点对象的属性值
   * @param finder 查找的父节点的所有子节点
   * @param calculationMethod 计算方式：默认“equal: 等于”，“lt: 小于”，“rt: 大于”
   */
  getTaskChildrenAnyKey(
    children,
    key: string,
    value: any,
    finder: Array<any>,
    calculationMethod?: string
  ) {
    if (children) {
      if (calculationMethod) {
        if (calculationMethod === 'lt') {
          if (children[key] && children[key] < value) {
            finder.push(children);
          }
        } else {
          if (children[key] && children[key] > value) {
            finder.push(children);
          }
        }
      } else {
        if (children[key] && children[key] === value) {
          finder.push(children);
        }
      }
      if (children && children.children && children.children.length) {
        children.children.forEach((v) => {
          this.getTaskChildrenAnyKey(v, key, value, finder, calculationMethod);
        });
      }
    }
  }

  /**
   * 调用递归：当前元素所在的所在树集合
   * @param taskNo 当前元素
   * @returns 当前元素所在的所在树集合
   */
  getParentTree(taskNo: string): any {
    if (!taskNo) {
      return null;
    }
    const finder = [];
    let index = 0;
    for (let i = 0; i < this.pageDatas.length; i++) {
      this.getTaskChildren(this.pageDatas[i], taskNo, finder);
      if (finder && finder.length) {
        index = i;
        break;
      }
    }
    return this.pageDatas[index];
  }

  // 返回根节点集合
  findRootTaskList(list: Array<any>): Array<any> {
    const rootTaskList = [];
    if (list && list.length) {
      list.forEach((element) => {
        let root_task = {};
        if (
          element['root_task_no'] === element['task_no'] &&
          element['root_task_no'] === element['upper_level_task_no']
        ) {
          root_task = cloneDeep(element);
          root_task['children'] = [];
          rootTaskList.push(root_task);
        }
      });
    }
    return rootTaskList;
  }

  /**
   * 将list结果改为tree
   * @param list 原始list数据
   * @returns 将list结果改为tree
   */
  changeListForTree(list: Array<any>) {
    const root_task_list = this.findRootTaskList(list);
    root_task_list.forEach((root_task) => {
      this.findChildrenByList(list, root_task);
    });
    return root_task_list;
  }

  /**
   * 找到当前任务卡的子节点
   * @param list 原始list数据
   * @param task 当前任务卡
   */
  findChildrenByList(list, task) {
    task['children'] = [];
    for (let i = 0; i < list.length; i++) {
      if (
        task['task_no'] === list[i]['upper_level_task_no'] &&
        task['root_task_no'] !== list[i]['task_no']
      ) {
        task['children'].push(list[i]);
      }
    }
    if (task['children'] && task['children'].length) {
      task['children'].forEach((element) => {
        this.findChildrenByList(list, element);
      });
    }
  }

  // 排序
  compare(property) {
    return function (a, b) {
      return a[property] - b[property];
    };
  }

  // 为当前树的层级sequence排序
  changeTreeChildrenSquence(list: Array<any>) {
    list.sort(this.compare('sequence'));
    list.forEach((obj) => {
      this.changeTreeChildrenSquence(obj.children);
    });
  }

  isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
  }
  isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  }
  // 深度判断两个数组是否完全相等
  equalsObj(oldData, newData) {
    // 类型为基本类型时,如果相同,则返回true
    if (oldData === newData) {
      return true;
    }
    if (
      this.isObject(oldData) &&
      this.isObject(newData) &&
      Object.keys(oldData).length === Object.keys(newData).length
    ) {
      // 类型为对象并且元素个数相同
      // 遍历所有对象中所有属性,判断元素是否相同
      for (const key in oldData) {
        if (oldData.hasOwnProperty(key)) {
          if (!this.equalsObj(oldData[key], newData[key])) {
            // 对象中具有不相同属性 返回false
            return false;
          }
        }
      }
    } else if (
      this.isArray(oldData) &&
      this.isArray(oldData) &&
      oldData.length === newData.length
    ) {
      // 类型为数组并且数组长度相同
      for (let i = 0, length = oldData.length; i < length; i++) {
        if (!this.equalsObj(oldData[i], newData[i])) {
          // 如果数组元素中具有不相同元素,返回false
          return false;
        }
      }
    } else {
      // 其它类型,均返回false
      return false;
    }
    // 走到这里,说明数组或者对象中所有元素都相同,返回true
    return true;
  }

  /**
   * 调用递归：当前任务卡所属的树是否包含任务比重 < 1
   * 1.管控，任务卡是否能拖拽，true不能
   * 2.管控，【使用模板】，true不能使用
   * @param task_no 拖拽的任务卡
   * @returns 所属的树是否包含任务卡的任务比重小于1
   */
  hasTaskProportionForThisTree(task_no: string): boolean {
    const parentTree = this.getParentTree(task_no);
    const finder = [];
    this.getTaskChildrenAnyKey(parentTree, 'task_proportion', 1, finder, 'lt');
    return finder && finder.length > 0 && this.projectInfo.project_status === '30';
  }

  /**
   * 获取任务依赖关系
   */
  projectTaskDependencyInfoGet(source?: string): Promise<any> {
    let params = null;
    if (source === Entry.projectChange) {
      // 取得依赖关系并展示，调用API-117.project.task.dependency.info.get ，入参：项目编号、变更版本、任务属性=3.项目变更
      params = {
        project_info: [
          {
            project_no: this.project_no,
            task_property: '3',
            change_version: this.change_version,
          },
        ],
      };
    } else {
      params = {
        project_info: [
          {
            project_no: this.project_no,
            task_property: source === Entry.maintain ? '2' : '1',
          },
        ],
      };
    }
    return new Promise((resolve): void => {
      this.commonService
        .getInvData('project.task.dependency.info.get', params)
        .subscribe((res): void => {
          resolve(res.data.task_info);
        });
    });
  }

  /**
   * 取得项目关键路径
   * @returns 任务卡路径信息
   */
  projectCriticalPathInfoGet(method?: string): Promise<any> {
    return new Promise((resolve): void => {
      const tenantId = this.userService.getUser('tenantId');
      // 【项目计划维护】-- 增加传入：计算方式=若 交付设计器参数.逾期天数纳入关键路径计算 =true，则传入1，否则传入2
      // 旧流程，若拿不到交付设计器参数.逾期天数纳入关键路径计算，默认按照2的方式处理
      this.commonService
        .getHasGroundEnd(tenantId, 'acceptanceOfOverdueDays')
        .toPromise()
        .then((res) => {
          // 交付设计器增加逾期天数纳入关键路径计算的参数：acceptanceOfOverdueDays
          let calculation_method = res?.data?.acceptanceOfOverdueDays ? '1' : '2';
          if (method !== 'projectChange') {
            if (method === 'card') {
              calculation_method = res?.data?.acceptanceOfOverdueDays ? '1' : '2';
            }
            // 【项目模板】-- 增加传入：计算方式 = 2
            if (method === 'maintain') {
              calculation_method = '2';
            }
            const params = {
              // 计算方式：1.逾期天数纳入关键路径计算；2.逾期天数不纳入关键路径计算
              calculation_method: calculation_method,
              algorithm_type: '2', // 算法类型	1.最长工期的路径；2.任务工期累计最长的路径
              task_property: method === Entry.maintain ? '2' : '1',
              project_info: [
                {
                  project_no: this.project_no,
                },
              ],
            };

            // spring 3.2 更换api名称 [入参、出参]：'project.critical.path.info.get' ==> 'bm.pisc.project.critical.path.get'
            this.commonService
              .getInvData('bm.pisc.project.critical.path.get', params)
              .subscribe((res2): void => {
                resolve(res2.data.task_info);
              });
          }
          if (method === 'projectChange') {
            const params = {
              // 计算方式：1.逾期天数纳入关键路径计算；2.逾期天数不纳入关键路径计算
              calculation_method: calculation_method,
              algorithm_type: '2', // 算法类型	1.最长工期的路径；2.任务工期累计最长的路径
              project_info: [
                {
                  project_no: this.project_no,
                  change_version: this.change_version,
                },
              ],
            };
            // 取得关键路径并展示，调用API-186.bm.pisc.project.change.critical.path.get
            // 入参：项目编号、变更版本、算法类型=2.任务工期累计最长的路径、计算方式=若交付设计器.逾期天数纳入关键路径计算勾选，则传入1，否则传入2
            this.commonService
              .getInvData('bm.pisc.project.change.critical.path.get', params)
              .subscribe((res2): void => {
                resolve(res2.data.task_info);
              });
          }
        });
    });
  }

  queryProjectId(params: any): Observable<any> {
    const url = `${this.smartDataUrl}/DataFootprint/task/queryByState`;
    return this.http.post(url, params, {
      headers: this.commonService.getHeader(),
    });
  }

  bmPiscProjectTypeGet(params): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('bm.pisc.project.type.get', {
          project_type_info: [params],
        })
        .subscribe((res): void => {
          resolve(res.data.project_type_info[0]);
        });
    });
  }

  /**
   * 获取查询签核进程的项目卡ID
   * @returns
   */
  async getProjectIdForQueryApprove(project_no, isChangeApprove): Promise<string> {
    let bkInfo: any = [
      {
        entityName: 'project_d',
        bk: {
          project_no,
        },
      },
    ];
    let tmpId = 'projectCenterConsoleStopProject_userProject';
    let actTmpId = 'pccStopProjectApprove';
    let actTmpIdT;
    if (isChangeApprove) {
      bkInfo = [
        {
          entityName: 'projectChange_d',
          bk: {
            project_no,
            change_version: this.change_approve_version,
          },
        },
      ];
      tmpId = 'PCC_project_0001';
      actTmpId = 'PCC_task_0010';
      actTmpIdT = 'PCC_task_0016';
    }
    // 个案签核进度
    const UcActTmpId = 'UC_pccStopProjectApprove';
    const params = {
      eocId: {},
      tenantId: this.userService.getUser('tenantId'),
      bkInfo,
      taskStates: [1, 2, 3, 4, 5],
      activityStates: [1, 2, 3, 4, 5, 6],
    };
    const res: any = await this.queryProjectId(params).toPromise();
    const subTasksItem = res.data[0]?.subTasks?.find((el) => {
      return el.state === 1 && el.tmpId === tmpId;
    });
    subTasksItem?.activities?.forEach((element) => {
      if (
        element.actTmpId === actTmpId ||
        element.actTmpId === UcActTmpId ||
        element.actTmpId === actTmpIdT
      ) {
        this.projectInfo.projectId = element.actId;
        console.log(this.projectInfo.projectId);
      }
    });
    return this.projectInfo.projectId;
  }

  // s6: 入参追加是否同步文档
  async getSyncDoc(): Promise<any> {
    const syncDoc = await this.commonService
      .getMechanismVariableList([
        {
          variableId: 'syncDoc',
        },
      ])
      .toPromise()
      .then((_res) => !!_res.data[0].result);
    return syncDoc;
  }
  // 记录管控时间
  recordTheControlTime(type = 'wbs-recordTheControlTime') {
    sessionStorage.setItem(type, Date.now().toString());
  }
  // 判断管控时间是否到指定时间
  controlTimeToTheSpecifiedTime(time: number, type = 'wbs-recordTheControlTime'): boolean {
    const recordTheControlTime = +sessionStorage.getItem(type) || Date.now() - time;
    if (Date.now() - recordTheControlTime >= time) {
      return true;
    }
    return false;
  }
  batchRecordTheControlTime(arr, callback: (...params: any) => string) {
    arr.forEach((...args) => {
      const type = callback(...args);
      this.recordTheControlTime(type);
    });
  }
  batchClearTheControlTime(arr, callback: (...params: any) => string) {
    arr.forEach((...args) => {
      const type = callback(...args);
      this.clearTheControlTime(type);
    });
  }
  // 清除管控时间
  clearTheControlTime(type = 'wbs-recordTheControlTime') {
    sessionStorage.removeItem(type);
  }
}
