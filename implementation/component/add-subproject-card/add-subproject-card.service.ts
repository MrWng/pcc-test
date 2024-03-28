import { Injectable } from '@angular/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CommonService, Entry } from '../../service/common.service';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';
import { ButtonType, TaskBaseInfo } from './add-subproject-card.interface';
import { DwUserService } from '@webdpt/framework/user';
import { TaskInfoGet } from 'app/customization/task-project-center-console/service/types/api-task-info-get';
import { map } from 'rxjs/operators';

// eslint-disable-next-line no-shadow
export enum NoAuthType {
  noPurchase = '未购买',
  expired = '已过期',
  noAuthorization = '未授权',
}
@Injectable()
export class AddSubProjectCardService {
  cacUrl: any;
  atdmUrl: string;
  eocUrl: string;
  dmcUrl: string;
  uibotUrl: string;
  smartDataUrl: string;
  taskEngineUrl: string;
  /** 是否显示弹窗 */
  showAddTaskCard: boolean = false;
  /** 首阶任务卡信息 */
  firstLevelTaskCard: any
  /** 当前编辑的卡片信息 */
  currentCardInfo: TaskInfoGet;
  /** 当前子项开窗的数据备份 */
  currentCardInfoBackups: object = null
  controlSwitch: any;
  /** 开窗title */
  taskCardTitle: string;
  /** 任务模板类型名称 */
  taskTemplateName: string = '';
  /** 任务模板类型编号 */
  taskTemplateNo: number = null;
  /** 任务类型 */
  taskCategory: string = '';
  /** 云端营运公司编号 */
  eocCompanyId: any;
  /** 云端营运据点编号 */
  eocSiteId: any;
  /** 云端营运域编号 */
  eocRegionId: any;
  /** 款项阶段编号 */
  arStageNo: string;
  /** 款项阶段名称 */
  arStageName: string;
  /** 是否显示自动排期 */
  isShowAutoSchedule: boolean = false;
  /** 上下文 */
  executeContext: any;
  /** 按钮类型 */
  buttonType: string;

  validateForm: FormGroup;

  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private fb: FormBuilder,
    public commonService: CommonService,
    public translateService: TranslateService,
    public wbsTabsService: WbsTabsService,
    private userService: DwUserService,
  ) {
    this.configService.getConfig().subscribe((urls: any) => {
      this.atdmUrl = urls.atdmUrl;
      this.eocUrl = urls.eocUrl;
      this.uibotUrl = urls.uibotUrl;
      this.smartDataUrl = urls.smartDataUrl;
      this.dmcUrl = urls.dmcUrl;
      this.taskEngineUrl = urls.taskEngineUrl;
      this.cacUrl = urls.cacUrl;
    });
  }

  /**
   * 打开开窗
   * 触发条件: 点击新建一计划/编辑一级计划/编辑子项/添加子项
   * @param title 开窗title
   * @param status 1:新建一级计划 2:添加子项 3:+号按钮，添加子项 4：编辑任务卡
   * @param firstLevelTaskCard 首阶任务卡信息v
   * @param targetCard 编辑任务卡信息
   */
  openAddSubProjectCard(
    title: string,
    status: ButtonType,
    firstLevelTaskCard?: any,
    targetCard?: any,
  ): void {
    this.showAddTaskCard = true; // 是否显示弹窗
    this.taskCardTitle = title; // 开窗名称
    this.buttonType = ButtonType[status]; // 点击了什么按钮类型
    this.firstLevelTaskCard = firstLevelTaskCard; // 首阶任务卡信息
    this.currentCardInfo = ['EDIT'].includes(ButtonType[status]) ? targetCard : {}; // 编辑任务卡信息
    // controlSwitch，控制 (+) 打开的子项开窗和子项开窗的显示和隐藏，帮俊替换后，后续不需要这个对象
    this.controlSwitch = ['PLUS', 'EDIT'].includes(ButtonType[status]) ? targetCard : firstLevelTaskCard;
    this.initValidateForm(status);
    this.initValue();
    this.evokeGuidance();
    this.handelPlmProject();
  }

  initValidateForm(status: ButtonType): void {
    this.isShowAutoSchedule = false;
    this.validateForm = this.fb.group({
      /** 任务名称 */
      task_name: [null, [Validators.required]],
      /** 上阶任务编号 */
      upper_level_task_no: [null],
      /** 是否依设备清单展开 true：是 false：否 */
      is_equipment_list_unfold: [false],
      /** 是否里程碑	true：是 false：否 */
      is_milepost: [false],
      /** 里程碑说明 */
      milepost_desc: [''],
      /** 工作量 */
      workload_qty: [null],
      /** 工作量单位	1.小时 2.日 3.月 */
      workload_unit: ['2'],
      /** 负责人 */
      liable_person_code_data: [null],
      liable_person_code: [''],
      liable_person_name: [''],
      liable_person_department_name: '',
      liable_person_department_code: '', // 负责人部门
      liable_person_role_no: '',
      liable_person_role_name: '',
      /** 交付物	true：是 false：否 */
      is_attachment: [false],
      /** 交付物樣板 */
      attachment: [{}],
      /** 交付物说明 */
      attachment_remark: [''],
      /** 备注 */
      remark: [''],
      /** 签核否	true.需签核 false.无需签核 */
      is_approve: [false],
      /** 必要任务	true：是 false：否 */
      required_task: [false],
      /** 报工说明 */
      remarks: [''],
      /** 任务名称 */
      task_no: [''],
      /** 任务成员信息 */
      task_member_info: [],
      /** 计划开始日期 */
      plan_start_date: '',
      /** 计划结束日期 */
      plan_finish_date: '',
      /** 预计工时 */
      plan_work_hours: [null],
      /** 任务依赖信息 */
      task_dependency_info: [
        [{
          /** 前置任务编号 */
          before_task_no: '',
          /** 依赖关系类型	FS:完成才开始;FF:完成才完成;SS:开始才开始 */
          dependency_type: 'FS',
          /** 提前滞后类型	-1:提前;1:滞后 */
          advance_lag_type: -1,
          /** 提前滞后天数 */
          advance_lag_days: 0,
        }]
      ],
      /** 单别信息 */
      doc_type_info: [{ doc_condition_value: '' }],
      /** 品号类别/群组 */
      item_type: [''],
      /** 品号类别条件值 */
      item_type_value: [''],
      /** 料号运算符 */
      item_operator: [''],
      /** 料号条件值 */
      item_condition_value: [''],
      /** 单别 */
      doc_type_no: [''],
      /** 单号 */
      doc_no: [''],
      /** 序号 */
      seq: [''],
      /** 类型条件值 */
      type_condition_value: [{ value: '', disabled: true }],
      /** 次类型条件值 */
      sub_type_condition_value: [{ value: '', disabled: true }],
      /** 托外条件值 */
      outsourcing_condition_value: [{ value: '', disabled: true }],
      /** 需要单别及单号	true：是 false： */
      is_need_doc_no: [false],
      task_status: '10',
      /** 顺序	由前端记录任务新增的顺序 */
      sequence: '',
      /** 任务分类编号 */
      task_classification_no: '',
      /** 任务分类名称 */
      task_classification_name: '',
      /** 难度等级 */
      difficulty_level_no: '',
      difficulty_level_name: '',
      difficulty_coefficient: '',
      /** 任务比重 */
      task_proportion: 100,
      /** 主单位	0.无 1.工时 2.重量 3.张数 4.数量 5.项数 */
      main_unit: ['0'],
      /** 次单位	0.无 1.工时 2.重量 3.张数 4.数量 5.项数 */
      second_unit: ['0'],
      /** 预计值(主单位) */
      plan_main_unit_value: '',
      /** 预计值(次单位) */
      plan_second_unit_value: '',
      /** 标准工时 */
      standard_work_hours: '',
      /** 标准天数 */
      standard_days: '',
      type_field_code: '',
      sub_type_field_code: '',
      outsourcing_field_code: '',
      is_doc_date: '',
      is_confirm_date: '',
      is_project_no: '',
      is_task_no: '',
      complete_rate_method: ''
    });
    if (['EDIT'].includes(ButtonType[status])) {
      this.isShowAutoSchedule = true;
      // 当前子项开窗的数据备份
      this.currentCardInfoBackups = JSON.parse(JSON.stringify(this.currentCardInfo));
      // 多执行人回显
      // const taskMemberInfo = this.currentCardInfo['task_member_info']?.map(
      //   item => item.executor_department_no + ';' + item.executor_no
      // );
      const formValue = {
        ...this.currentCardInfo,
        // liable_person_code_data: personListItem,
        // task_member_info: taskMemberInfo,
        doc_type_info: this.currentCardInfo['doc_condition_value'].split(','),
        task_proportion: (Number(this.currentCardInfo['task_proportion']) * 100).toFixed(2),
        plan_main_unit_value: this.currentCardInfo['plan_main_unit_value'] || '',
        plan_second_unit_value: this.currentCardInfo['plan_second_unit_value'] || '',
        standard_work_hours: this.currentCardInfo['standard_work_hours'] || '',
        standard_days: this.currentCardInfo['standard_days'] || ''
      };
      this.validateForm.patchValue(formValue);
    } else {
      this.validateForm.get('upper_level_task_no')?.setValue(ButtonType[status] === 'PLUS' ? this.controlSwitch['task_no'] : null);
    }
  }

  initValue(): void {
    this.arStageNo = this.currentCardInfo?.ar_stage_no ?? '';
    this.arStageName = this.currentCardInfo?.ar_stage_name ?? '';
    this.taskCategory = this.currentCardInfo?.task_category ?? '';
    this.taskTemplateNo = this.currentCardInfo?.task_template_no ?? null;
    this.taskTemplateName = this.currentCardInfo?.task_template_name ?? '';
    this.eocSiteId = this.currentCardInfo?.eoc_site_id ? { id: this.currentCardInfo.eoc_site_id } : {};;
    this.eocRegionId = this.currentCardInfo?.eoc_region_id ? { id: this.currentCardInfo.eoc_region_id } : {};
    this.eocCompanyId = this.currentCardInfo?.eoc_company_id ? { id: this.currentCardInfo.eoc_company_id } : {};
  }

  evokeGuidance(): void {
    if (this.validateForm.getRawValue().upper_level_task_no) {
      this.wbsTabsService.evokeGuidance('project', 'PCC_TAB001', 'PCC', 'PCC_TAB001-PCC_BUTTON002');
    } else {
      this.wbsTabsService.evokeGuidance('project', 'PCC_TAB001', 'PCC', 'PCC_TAB001-PCC_BUTTON001');
    }
  }

  handelPlmProject(): void {
    if (['PLM_PROJECT'].includes(this.taskCategory)) {
      this.validateForm.get('task_member_info').disable();
      this.validateForm.get('task_member_info').patchValue([]);
    }
  }

  // 获取负责人list
  queryChargePersonList(param?: string): Observable<any> {
    const options = {
      headers: this.commonService.getHeader(),
    };
    const params = JSON.stringify({ content: param });
    let url = `${this.eocUrl}/api/eoc/v2/emp?pageSize=9999&params=` + params;
    url = encodeURI(url);
    return this.http.get(url, options);
  }

  // 自动排期
  postProcess(tenantId: any, params: any, content: any): Observable<any> {
    const _params = {
      tenantId,
      actionId: 'startSC_Start_ProjectCenterConsole_AutoScheduling',
      paras: params,
      eocMap: {
        eoc_company_id: content?.businessUnit?.eoc_company_id,
      },
    };
    const url = `${this.smartDataUrl}/ExecutionEngine/execute`;
    return this.http.post(url, _params);
  }

  postProcessNew(locale, requesterId, params: any, content: any): Observable<any> {
    const _params = {
      projectCode: 'projectCenterConsole_autoScheduling_mainProject',
      dispatchData: params,
      process_EOC: {
        eoc_company_id: content?.businessUnit?.eoc_company_id,
      },
      requesterId: requesterId,
      locale: locale,
      variables: {},
    };
    const url = `${this.taskEngineUrl}/api/project/create`;
    return this.http.post(url, _params);
  }

  // 合并user数据
  mergeUserList(list: any): any {
    const map = {};
    const groupData = [];
    list.forEach((element): void => {
      element.bigId = element.deptId + ';' + element.id;
      if (!map[element.deptId]) {
        groupData.push({
          deptId: element.deptId,
          deptName: element.deptName,
          list: [element],
        });
        map[element.deptId] = element;
      } else {
        groupData.forEach((data): void => {
          if (data.deptId === element.deptId) {
            data.list.push(element);
          }
        });
      }
    });
    return groupData;
  }

  /**
   * 初始化【负责人】、【执行人】的tree结构：list --> tree
   */
  formatListToTree(list: any): any {
    const obj = {};
    const obj2 = {};
    const groupData = [];
    list.forEach((element): void => {
      if ('roleNo' in Object(element)) {
        element.bigId = element.roleNo + ';' + element.deptId + ';' + element.id;
        if (!obj[element.roleNo]) {
          if (!obj2[element.roleNo + element.deptId]) {
            groupData.push({
              roleNo: element.roleNo,
              roleName: element.roleName,
              title: element.roleName,
              key: element.roleNo,
              selectable: false,
              disableCheckbox: true,
              children: [{
                deptId: element.deptId,
                deptName: element.deptName,
                title: element.deptName,
                key: element.roleNo +';'+ element.deptId,
                selectable: false,
                disableCheckbox: true,
                children: [element],
              }],
            });
            obj2[element.roleNo + element.deptId] = 1;
          }
          obj[element.roleNo] = 1;
        } else {
          if (!obj2[element.roleNo + element.deptId]) {
            groupData.forEach((data): void => {
              if (data.roleNo === element.roleNo) {
                data.children.push({
                  deptId: element.deptId,
                  deptName: element.deptName,
                  title: element.deptName,
                  key: element.roleNo +';'+ element.deptId,
                  selectable: false,
                  disableCheckbox: true,
                  children: [element],
                });
              }
            });
            obj2[element.roleNo + element.deptId] = 1;
          } else {
            groupData.forEach((data): void => {
              if (data.roleNo === element.roleNo) {
                data.children.forEach(item2 => {
                  if (item2.deptId === element.deptId) {
                    item2.children.push(element);
                  }
                });
              }
            });
          }
        }
      }
    });
    return groupData;
  }

  // 开窗获取任务模板
  getTaskTemplate(flag: string, source?: string): Observable<any> {
    // spring 3.0 更换api名称：'task.template.parameter.info.get' ==> 'bm.pisc.task.template.parameter.get'
    const params = {
      tmAction: {
        actionId: 'esp_bm.pisc.task.template.parameter.get',
        title: this.translateService.instant('dj-default-选择项目模板'),
        actionParams: [],
        language: {
          title: {
            en_US: 'recommend',
            zh_TW: '推薦',
          },
        },
        metadataFields: [
          {
            dataType: 'string',
            name: 'user_defined01',
            description: this.translateService.instant('dj-pcc-类型栏位代号')
          },
          {
            dataType: 'string',
            name: 'user_defined02',
            description: this.translateService.instant('dj-pcc-次类型栏位代号')
          },
          {
            dataType: 'string',
            name: 'user_defined03',
            description: this.translateService.instant('dj-pcc-托外栏位代号')
          }
        ],
        type: 'ESP',
        // url: 'http://esp.digiwincloud.com.cn/CROSS/RESTful',
        actionResponse: null,
        serviceName: 'bm.pisc.task.template.parameter.get',
        needProxyToken: null,
        attachActions: null,
        flatData: null,
      },
      executeContext:
        source !== Entry.card ? this.executeContext : this.commonService.content.executeContext,
    };
    params['tmAction']['paras'] = { task_template_parameter_info: [{ manage_status: 'Y' }] };
    if (flag === '1') {
      params['tmAction']['paras'] = {
        eoc_company_id: this.eocCompanyId?.id || '',
        eoc_site_id: this.eocSiteId?.id || '',
        eoc_region_id: this.eocRegionId?.id || '',
        task_template_parameter_info: [{ manage_status: 'Y' }]
      };
    }
    const url = `${this.uibotUrl}/api/ai/v1/data/query/action`;
    return this.http.post(url, params, {
      headers: this.commonService.getHeader(),
    });
  }

  // 开窗获取款项阶段
  getPaymentPeriod(company: string, project_no: string, source?: string): Observable<any> {
    const params = {
      tmAction: {
        actionId: 'esp_project.order.instalment.data.get', // 取得专案订单账款分期信息
        title: this.translateService.instant('dj-default-选择款项阶段'),
        actionParams: [],
        language: {
          title: {
            en_US: 'recommend',
            zh_TW: '推薦',
          },
        },
        paras: {
          eoc_company_id: company,
          project_info: [
            {
              project_no: project_no || '',
              eoc_company_id: company,
            },
          ],
        },
        type: 'ESP',
        actionResponse: null,
        serviceName: 'project.order.instalment.data.get',
        needProxyToken: null,
        attachActions: null,
        flatData: null,
      },
      executeContext:
        source !== Entry.card ? this.executeContext : this.commonService.content.executeContext,
    };
    const url = `${this.uibotUrl}/api/ai/v1/data/query/action`;
    return this.http.post(url, params, {
      headers: this.commonService.getHeader(),
    });
  }

  editTaskCard(tenantId, params: any, content: any): Observable<any> {
    const executeContext = content.executeContext;
    const _params = {
      tenantId,
      actionId: 'startSC_Start_ProjectCenterConsole_UpdateTask',
      paras: params,
      eocMap: {
        eoc_company_id: executeContext.businessUnit.eoc_company_id,
      },
    };
    const url = `${this.smartDataUrl}/ExecutionEngine/execute`;
    return this.http.post(url, _params);
  }

  editTaskCardNew(locale, requesterId, params: any, content: any): Observable<any> {
    const executeContext = content.executeContext;
    const _params = {
      projectCode: 'projectCenterConsoleUpdateTask_mainProject',
      dispatchData: params,
      process_EOC: {
        eoc_company_id: executeContext?.businessUnit?.eoc_company_id,
      },
      requesterId: requesterId,
      locale: locale,
      variables: {},
    };
    const url = `${this.taskEngineUrl}/api/project/create`;
    return this.http.post(url, _params);
  }

  addOrDeleteTaskCard(tenantId, params: any, content: any): Observable<any> {
    const executeContext = content.executeContext;
    const _params = {
      tenantId,
      actionId: 'startSC_Start_ProjectCenterConsole_CancelTask',
      paras: params,
      eocMap: {
        eoc_company_id: executeContext.businessUnit.eoc_company_id,
      },
    };
    const url = `${this.smartDataUrl}/ExecutionEngine/execute`;
    return this.http.post(url, _params);
  }

  addOrDeleteTaskCardNew(locale, requesterId, params: any, content: any): Observable<any> {
    const executeContext = content.executeContext;
    const _params = {
      projectCode: 'projectCenterConsole_cancelTask_mainProject',
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

  UseTemplateHandleOk(): void { }

  filterSize(size) {
    return size / this.pow1024(2);
  }

  pow1024(num: number) {
    return Math.pow(1024, num);
  }

  // 格式化文件大小
  renderSize(value) {
    if (null === value || value === '') {
      return '0 Bytes';
    }
    const unitArr = new Array('Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB');
    let index = 0;
    const srcsize = parseFloat(value);
    index = Math.floor(Math.log(srcsize) / Math.log(1024));
    const size = srcsize / Math.pow(1024, index);
    // 保留的小数位数
    const sizeName = size.toFixed(2);
    return sizeName + unitArr[index];
  }

  // 判断是否是图片
  isAssetTypeAnImage(ext) {
    return (
      ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'].indexOf(
        ext.toLowerCase()
      ) !== -1
    );
  }

  /**
   * 判断指定用户是否可以使用商品
   * @param userId 人员编号
   * @returns
   */
  getAthenaAuthorization(userId: string): Observable<any> {
    const url = `${this.cacUrl}/api/cac/v4/authorizations/currentTenant/users/${userId}/goods/athena/byUser`;
    return this.http.get(url).pipe(
      map((res: any) => {
        res.noAuthType = res.noAuthType ? NoAuthType[res.noAuthType] : '';
        return res.noAuthType;
      })
    );
  }


  /**
   *更新任务基础信息/ 更新敏态任务基础资料
   * @param params
   * @returns task_info 任务卡信息
   */
  taskBaseInfoUpdate(params: any): Promise<TaskBaseInfo> {
    return new Promise((resolve, reject) => {
      this.commonService.getInvData('task.base.info.update', { task_info: [params] }).subscribe(
        (res: any): void => {
          resolve(res.data.task_info[0]);
        },
        (err: any): void => {
          reject(err.description);
        }
      );
    });
  }


  /**
 * 记录任务卡是否被修改过
 */
  recordModified(): void {
    this.currentCardInfo.hasEdit = true;
    sessionStorage.setItem(
      'hasEditFromProjectNo',
      this.currentCardInfo.project_no.toString()
    );
    const hasEditFromTaskNoArr: Array<string> = sessionStorage.getItem('hasEditFromTaskNoArr')
      ? sessionStorage.getItem('hasEditFromTaskNoArr').split(',')
      : [];
    hasEditFromTaskNoArr.push(this.currentCardInfo.task_no);
    sessionStorage.setItem('hasEditFromTaskNoArr', hasEditFromTaskNoArr.toString());
  }

  /**
 * 调用服务编排
 * @param params
 */
  getServiceOrchestration(params: any): void {
    const orchestrationParam = {
      task_plan: [
        {
          project_no: params.project_no,
          task_no: params.task_no,
          liable_person_code: params.liable_person_code,
          liable_person_name: params.liable_person_name,
        },
      ],
    };
    this.commonService.getServiceOrchestration(orchestrationParam).subscribe(() => { });
  }

  /**
 * 获取项目
 */
  bmPiscProjectGet(project_no: string): Promise<any> {
    return new Promise(resolve => {
      this.commonService
        .getInvData('bm.pisc.project.get', { project_info: [{ project_no }] })
        .subscribe((res: any): void => {
          resolve(res.data.project_info[0]);
        });
    });
  }

  /**
   * 添加或删除任务流程
   * @param project_no 项目编号
   * @param modelType 是否是DTD流程
   * @param task_no 上阶任务编号
   */
  addOrDeleteTaskFlow(project_no: string, modelType: string, upper_level_task_no: string, source?: string): void {
    const tenantId = this.userService.getUser('tenantId');
    const userId = this.userService.getUser('userId');
    const param = [{ project_no, task_no: upper_level_task_no }];
    if ((modelType.indexOf('DTD') !== -1) || (source === Entry.collaborate)) {
      const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
      this.addOrDeleteTaskCardNew(DwUserInfo.acceptLanguage, userId, param, this.commonService.content)
        .subscribe(() => { });
    } else {
      this.addOrDeleteTaskCard(tenantId, param, this.commonService.content)
        .subscribe(() => { });
    }
  }

  /**
   * 更新任务流程
   * @param params 任务信息
   */
  updateTaskFlow(params: any, modelType: string, project_no: string, source?: string): void {
    if ((modelType.indexOf('DTD') !== -1) || (source === Entry.collaborate)) {
      // 任务卡重推流程优化，应用场景：当非PLM_PROJECT类型的任务下发后，此时任务状态会是未开始，若PM此时调整任务类型为PLM_PROJECT时，重推任务卡时，需同步创建PLM项目
      if (this.currentCardInfo?.project_status === '30' && this.currentCardInfo.is_issue_task_card) {
        this.updateTaskMainProject(params, project_no);
      }
    } else {
      this.projectCenterConsoleUpdateTask(params, project_no);
    }

  }

  updateTaskMainProject(params: any, project_no: string, isBatchProcess?: boolean): void {
    const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
    const id = this.userService.getUser('userId');
    let param = [];
    if (!isBatchProcess) {
      param =
        [
          {
            project_no,
            task_no: params.task_no,
            needToReset: true,
          },
        ];
    } else {
      param = params;
    }
    this.editTaskCardNew(
      DwUserInfo.acceptLanguage,
      id,
      param,
      this.commonService.content
    ).subscribe(() => { });

  }

  projectCenterConsoleUpdateTask(params: any, project_no: string): void {
    const tenantId = this.userService.getUser('tenantId');
    const param = [
      {
        project_no,
        task_no: params.task_no,
        needToReset: true,
      },
    ];
    this.editTaskCard(tenantId, param, this.commonService.content)
      .subscribe(() => { });

  }

  taskDependencyCheck(params: any, taskProperty?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // [3.2] 更换api名称 [入参、]：'task.dependency.check' ==> 'bm.pisc.task.dependency.check'
      this.commonService
        .getInvData('bm.pisc.task.dependency.check', {
          task_property: taskProperty,
          project_info: [{ project_no: params.project_no }]
        })
        .subscribe((res: any): void => {
          resolve(res.data);
        }, (err) => {
          reject(err.description);
        });
    });
  }

  taskInfoCreate(params: any): Promise<any> {
    return new Promise((resolve) => {
      this.commonService
        .getInvData('task.info.create', { task_info: [params] })
        .subscribe((res: any): void => {
          resolve(res.data.task_info[0]);
        });
    });
  }

}
