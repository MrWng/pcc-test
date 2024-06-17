import { Injectable } from '@angular/core';
import { DynamicWbsService } from '../wbs/wbs.service';
import { CommonService, Entry } from '../../service/common.service';
import { DwUserService } from '@webdpt/framework/user';
import { TaskBaseInfo } from '../add-subproject-card/add-subproject-card.interface';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { HttpClient } from '@angular/common/http';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';
import { cloneDeep } from '@athena/dynamic-core';
import * as moment from 'moment';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { DwLanguageService } from '@webdpt/framework';

@Injectable()
export class ProjectTableService {
  cacUrl: any;
  atdmUrl: string;
  eocUrl: string;
  dmcUrl: string;
  uibotUrl: string;
  smartDataUrl: string;
  taskEngineUrl: string;
  preTaskNumListBackUp: any[] = [];
  preTaskNumListChange: any[] = [];

  constructor(
    public wbsService: DynamicWbsService,
    public commonService: CommonService,
    private userService: DwUserService,
    private messageService: NzMessageService,
    private configService: DwSystemConfigService,
    private http: HttpClient,
    public wbsTabsService: WbsTabsService,
    private addSubProjectCardService: AddSubProjectCardService,
    private languageService: DwLanguageService
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
   * 协同任务卡添加按钮权限管控:
   * 协同任务卡定制页：
   * 1.进行中的协同计划排定任务[45.bm.pisc.assist.schedule.get回传当前协同任务的计划排定状态为1.进行中]
   *   1.1项目状态=10.未开始，按钮可用
   *   1.2项目状态=30.进行中，当前任务不存在任务比重<100%的下阶任务，并且任务状态是10.未开始的，按钮可用
   *   1.3项目状态=30.进行中，当前任务不存在任务比重<100%的下阶任务，并且任务状态是20.进行中 且 当前任务非尾阶，按钮可用
   * 项目模版维护定制页：
   *
   */
  getAddButtonPermissions(
    taskCard: any,
    schedule_status,
    noHasChildWithTaskProportionLessOne: boolean
  ): boolean {
    const project_status = this.wbsService?.projectInfo?.project_status;
    return (
      schedule_status === '1' &&
      (project_status === '10' ||
        (project_status === '30' &&
          noHasChildWithTaskProportionLessOne &&
          taskCard.old_task_status === '10') ||
        (project_status === '30' &&
          noHasChildWithTaskProportionLessOne &&
          taskCard.old_task_status === '20' &&
          taskCard?.children?.length))
    );
  }

  /**
   * 判断当前任务是否存在任务比重<100%的下阶任务
   * @param item
   * @returns
   */
  hasChildWithTaskProportionLessOne(item: any): boolean {
    for (const child of item.children) {
      if (child.task_proportion < 1) {
        return true;
      }
      if (this.hasChildWithTaskProportionLessOne(child)) {
        return true;
      }
    }
    return false;
  }

  /**
   *  协同排定明细删除处理
   * @param params
   * @returns assist_task_detail_info 协同排定任务明细信息
   */
  async deleteAssistTaskDetail(assist_task_detail_info: any): Promise<any> {
    const res: any = await this.commonService
      .getInvData('bm.pisc.assist.task.detail.delete.process', assist_task_detail_info)
      .toPromise();
    return res?.data?.assist_task_detail_info?.[0];
  }

  /**
   *  删除任务信息项目变更
   * @param params
   * @returns task_info 任务明细
   */
  async deleteTaskChangeInfo(params: any): Promise<any> {
    const res: any = await this.commonService
      .getInvData('bm.pisc.project.change.task.detail.delete', params)
      .toPromise();
    return res;
  }

  /**
   *  删除任务信息
   * @param params
   * @returns task_info 任务明细
   */
  async deleteTaskInfo(params: any): Promise<any> {
    const res: any = await this.commonService.getInvData('task.info.delete', params).toPromise();
    return res;
  }

  /**
   * 获取项目
   */
  async getProjectInfo(): Promise<any> {
    const res: any = await this.commonService
      .getInvData('bm.pisc.project.get', {
        project_info: [{ project_no: this.wbsService.project_no }],
      })
      .toPromise();
    return res?.data?.project_info[0];
  }

  /**
   * 获取入参 提交内容
   * @param enterParams
   * @param updateValues
   * @param personList
   */
  handelData(enterParams: any, updateValues, personList?, source?: string) {
    const { changeReason, change_attachment, hasGroundEnd } = enterParams;
    const params = { ...updateValues };
    let role_name_temp = '';
    if (this.languageService.currentLanguage === 'zh_TW') {
      role_name_temp = '無角色';
    } else if (this.languageService.currentLanguage === 'zh_CN') {
      role_name_temp = '无角色';
    } else {
      role_name_temp = 'no role';
    }
    // 是否录入变更原因
    params.record_task_change = changeReason.status;
    // 变更原因
    params.change_reason = changeReason?.value;
    if (change_attachment) {
      params.change_attachment = change_attachment;
    }
    const isMaintain = source === Entry.maintain;
    if (params.liable_person_code_key) {
      personList.forEach((person) => {
        const { role_name, role_no, department_name, department_no, employee_name, employee_no } =
          person;
        const liable_person_code_key = params.liable_person_code_key.split('/');
        if (
          (liable_person_code_key[0] === role_no || liable_person_code_key[0] === role_name) &&
          liable_person_code_key[1] === department_no &&
          liable_person_code_key[2] === employee_no
        ) {
          const liable_person_role_name = role_name || liable_person_code_key[0];
          params.liable_person_code = employee_no;
          params.liable_person_name = employee_name;
          params.liable_person_department_code = department_no;
          params.liable_person_department_name = department_name;
          params.liable_person_role_no = role_no;
          params.liable_person_role_name = !isMaintain
            ? liable_person_role_name
            : liable_person_role_name === role_name_temp
            ? ''
            : liable_person_role_name;
        }
      });
    } else {
      params.liable_person_code = '';
      params.liable_person_name = '';
      params.liable_person_department_code = '';
      params.liable_person_department_name = '';
      params.liable_person_role_no = '';
      params.liable_person_role_name = '';
    }
    // 处理多执行人入参
    if (
      params.liable_person_code_key &&
      params.task_member_info_key?.length &&
      params.task_member_info_key?.length > 0
    ) {
      const task_member_info = params.task_member_info;
      params.task_member_info = params.task_member_info_key.map((info_key) => {
        let info = {},
          hasPeople = false;
        if (task_member_info.length) {
          const info_key_arr = info_key.split('/');
          task_member_info.forEach((infoListItem: any): void => {
            const {
              executor_role_no,
              executor_role_name,
              executor_department_name,
              executor_department_no,
              executor_no,
              executor_name,
            } = infoListItem;
            const hasExecutorRoleNo = info_key_arr[0] === executor_role_no,
              hasExecutorRoleName =
                executor_role_name === ''
                  ? info_key_arr[0] === role_name_temp
                  : info_key_arr[0] === executor_role_name;
            if (
              (hasExecutorRoleNo || hasExecutorRoleName) &&
              info_key_arr[1] === executor_department_no &&
              info_key_arr[2] === executor_no
            ) {
              hasPeople = true;
              let executorRoleName, executorRoleNo;
              if (!isMaintain) {
                executorRoleName = executor_role_name === '' ? role_name_temp : executor_role_name;
              } else {
                executorRoleName = executor_role_name;
              }
              info = {
                executor_role_name: executorRoleName,
                executor_role_no: executor_role_no ? executor_role_no : '',
                executor_department_name: executor_department_name,
                executor_department_no: executor_department_no,
                executor_name: executor_name,
                executor_no: executor_no,
                project_no: params.project_no,
                task_no: params.task_no,
              };
            }
          });
        }
        if (!hasPeople) {
          personList.forEach((person) => {
            const {
              role_name,
              role_no,
              department_name,
              department_no,
              employee_name,
              employee_no,
            } = person;
            const info_key_arr = info_key.split('/');
            if (
              (info_key_arr[0] === role_no || info_key_arr[0] === role_name) &&
              info_key_arr[1] === department_no &&
              info_key_arr[2] === employee_no
            ) {
              let executorRoleName, executorRoleNo;
              if (!isMaintain) {
                executorRoleName = role_name ? role_name : '';
              } else {
                executorRoleName = role_name === role_name_temp ? '' : role_name || '';
              }
              info = {
                executor_role_name: executorRoleName,
                executor_role_no: role_no ? role_no : '',
                executor_department_name: department_name,
                executor_department_no: department_no,
                executor_name: employee_name,
                executor_no: employee_no,
                project_no: params.project_no,
                task_no: params.task_no,
              };
            }
          });
        }
        return info;
      });
    } else {
      params.task_member_info = [];
    }

    // 如果单别条件值为对象转成数组
    if (
      params.doc_type_info &&
      Object.prototype.toString.call(params.doc_type_info) === '[object Object]'
    ) {
      params.doc_type_info = [params.doc_type_info];
    }
    if (params.doc_type_info?.length) {
      params.doc_type_info = params.doc_type_info.map((doc) => {
        if (Object.getOwnPropertyNames(doc).find((item) => item === 'doc_condition_value')) {
          return doc;
        } else {
          return { doc_condition_value: doc };
        }
      });
    }
    params.plan_start_date = params.plan_start_date
      ? moment(params.plan_start_date).format('YYYY-MM-DD')
      : '';
    params.plan_finish_date = params.plan_finish_date
      ? moment(params.plan_finish_date).format('YYYY-MM-DD')
      : '';
    params.task_status = String(params.task_status);
    params.main_unit = String(params.main_unit);
    params.second_unit = String(params.second_unit);
    const val1 = params.plan_main_unit_value === '' ? 0 : params.plan_main_unit_value;
    params.plan_main_unit_value = Number(val1);
    const val2 = params.plan_second_unit_value === '' ? 0 : params.plan_second_unit_value;
    params.plan_second_unit_value = Number(val2);
    const val3 = params.standard_work_hours === '' ? 0 : params.standard_work_hours;
    params.standard_work_hours = Number(val3);
    const val4 = params.standard_days === '' ? 0 : params.standard_days;
    params.standard_days = Number(val4);
    params.is_equipment_list_unfold = null;
    // 若交付設計器.是否依賴地端=true傳入Y否則傳入N
    params.sync_steady_state = hasGroundEnd !== 'Y' ? null : 'Y'; // 同步稳态	Y.同步；N.不同步 不传或传null，默认Y
    params.operation_no = this.userService.getUser('userId');
    params.operation_name = this.userService.getUser('userName');
    return params;
  }

  /**
   * 更新任务基础信息/ 更新敏态任务基础资料
   * @param params
   * @param closeLoading
   * @returns task_info 任务卡信息
   */
  async taskBaseInfoUpdate(params: any, closeLoading): Promise<TaskBaseInfo> {
    try {
      const res: any = await this.commonService
        .getInvData('task.base.info.update', params)
        .toPromise();
      return res.data.task_info[0];
    } catch (err) {
      return Promise.reject(err.description);
    } finally {
      closeLoading();
    }
  }

  /**
   *  协同排定任务明细更新
   * @returns assist_task_detail_info 协同排定任务明细信息
   * @param param
   * @param root_task_card
   * @param project_no
   * @param closeLoading
   */
  async assistTaskDetailUpdate(
    param: any,
    root_task_card: any,
    project_no,
    closeLoading
  ): Promise<any> {
    try {
      const date_check = await this.addSubProjectCardService.getDateCheck();
      await this.resetParamData(param, root_task_card, project_no);
      const params = { date_check, assist_task_detail_info: [param] };
      const res: any = await this.commonService
        .getInvData('bm.pisc.assist.task.detail.update', params)
        .toPromise();
      return res?.data?.assist_task_detail_info?.[0];
    } catch (err) {
      closeLoading();
      return Promise.reject(err.description);
    }
  }

  /**
   * 更新任务基础信息/ 更新敏态任务基础资料 项目变更
   * @param params
   * @param closeLoading
   * @returns task_info 任务卡信息
   */
  async taskBaseInfoChangeUpdate(params: any, closeLoading): Promise<TaskBaseInfo> {
    try {
      await this.resetParamChangeData(params);
      const updateParams = {
        project_change_task_detail_info: [params],
        is_update_task_date: true,
        is_check_task_dependency: true,
      };
      const res: any = await this.commonService
        .getInvData('bm.pisc.project.change.task.detail.update', updateParams)
        .toPromise();
      return {};
    } catch (err) {
      closeLoading();
      return Promise.reject(err.description);
    }
  }

  async resetParamData(param, root_task_card, project_no = ''): Promise<void> {
    param.liable_person_role_name = param.liable_person_role_no
      ? param.liable_person_role_name
      : ''; // 负责人角色名称
    param.assist_schedule_seq = root_task_card.assist_schedule_seq; // 协助排定计划序号
    param.root_task_no = root_task_card.root_task_no; // 前置任务编号
    param.old_task_status = param.task_status; // 原任务状态
    param.responsible_person_no = param.liable_person_code; // 负责人编号
    param.responsible_person_name = param.liable_person_name; // 负责人名称
    param.responsibility_department_no = param.liable_person_department_code; // 负责人部门编号
    param.responsibility_department_name = param.liable_person_department_name; // 负责人部门名称
    param.liable_person_role_name = param.liable_person_role_no
      ? param.liable_person_role_name
      : '';
    param.is_project_code = param.is_project_no; // 项目编号条件
    // param.doc_seq = param.seq; // 单据序號
    // const doc_condition_value_list = param.doc_type_info?.filter(item => item.doc_condition_value !== ''); // 单别条件值
    // param.doc_condition_value = doc_condition_value_list?.map(item => item.doc_condition_value).join(',') ?? '';
    // param.assist_task_dependency_info = param.task_dependency_info; // 协同排定任务依赖关系信息
    // await Promise.all(param.assist_task_dependency_info.map(async o => {
    //   const root_task_no = await this.getRootTaskInfo(o.before_task_no, project_no); // 前置根任务编号 传入 前置根任务编号
    //   o.before_root_task_no = root_task_no?.before_root_task_no;
    // }));
    // param['assist_task_dependency_info'] = [];
    // if (param.task_dependency_info?.length && this.preTaskNumListBackUp?.length ) {
    //   param['assist_task_dependency_info'] = cloneDeep(param.task_dependency_info);
    //   param.assist_task_dependency_info.forEach(info => {
    //     Reflect.deleteProperty(info, 'project_no');
    //     this.preTaskNumListBackUp.forEach(item => {
    //       if (item.task_no === info.before_task_no) {
    //         info['before_root_task_no'] = item.root_task_no;
    //       }
    //     });
    //   });
    // }
    param.assist_task_member_info = cloneDeep(param.task_member_info); // 协同排定任务执行人信息
    param.assist_task_member_info.forEach((item) => {
      item.executor_role_name = item.executor_role_no ? item.executor_role_name : '';
    });
    delete param.is_assist_update;
  }

  /**
   * 项目变更数据转换
   */
  async resetParamChangeData(param): Promise<void> {
    param.liable_person_role_name = param.liable_person_role_no
      ? param.liable_person_role_name
      : ''; // 负责人角色名称
    param.old_task_status = param.task_status; // 原任务状态
    param.responsible_person_no = param.liable_person_code; // 负责人编号
    param.responsible_person_name = param.liable_person_name; // 负责人名称
    param.responsibility_department_no = param.liable_person_department_code; // 负责人部门编号
    param.responsibility_department_name = param.liable_person_department_name; // 负责人部门名称
    param.liable_person_role_name = param.liable_person_role_no
      ? param.liable_person_role_name
      : '';
    param.task_template_parameter_no = param.task_template_no; // 任务模板类型编号
    param.task_template_parameter_name = param.task_template_name; // 任务模板类型名称
    param.user_defined01 = param.type_field_code; // 类型栏位代号
    param.user_defined01_value = param.type_condition_value; // 类型条件值
    param.user_defined02 = param.sub_type_field_code; // 次类型栏位代号
    param.user_defined02_value = param.sub_type_condition_value; // 次类型条件值
    param.user_defined03 = param.outsourcing_field_code; // 托外栏位代号
    param.user_defined03_value = param.outsourcing_condition_value; // 托外条件值
    param.report_description = param.report_work_description; // 报工说明
    param.doc_seq = param.seq; // 单据序號
    param.plan_work_hours = param.plan_work_hours === '' ? 0 : param.plan_work_hours;
    const doc_condition_value_list = param.doc_type_info?.filter(
      (item) => item.doc_condition_value !== ''
    ); // 单别条件值
    param.doc_condition_value =
      doc_condition_value_list?.map((item) => item.doc_condition_value).join(',') ?? '';
    // param.assist_task_dependency_info = param.task_dependency_info; // 协同排定任务依赖关系信息
    // await Promise.all(param.assist_task_dependency_info.map(async o => {
    //   const root_task_no = await this.getRootTaskInfo(o.before_task_no, project_no); // 前置根任务编号 传入 前置根任务编号
    //   o.before_root_task_no = root_task_no?.before_root_task_no;
    // }));
    param['project_change_task_dep_info'] = [];
    if (param.task_dependency_info?.length && this.preTaskNumListChange?.length) {
      param['project_change_task_dep_info'] = cloneDeep(param.task_dependency_info);
      param.project_change_task_dep_info?.forEach((info) => {
        Reflect.deleteProperty(info, 'project_no');
        this.preTaskNumListChange.forEach((item) => {
          if (item.task_no === info.before_task_no) {
            info['before_root_task_no'] = item.root_task_no;
          }
        });
      });
    }
    param.project_change_task_member_info = cloneDeep(param.task_member_info); // 协同排定任务执行人信息
    param.project_change_task_member_info?.forEach((item) => {
      item.executor_role_name = item.executor_role_no ? item.executor_role_name : '';
    });
  }

  /**
   * 项目编号错误讯息mistakeMessage
   * @param task_info
   * @returns
   */
  mistakeMessage(task_info: TaskBaseInfo): boolean {
    if (task_info?.project_no_mistake_message) {
      this.messageService.error(task_info.project_no_mistake_message);
    }
    return !task_info?.project_no_mistake_message;
  }

  /**
   * 获取项目
   */
  bmPiscProjectGet(project_no: string): Promise<any> {
    return new Promise((resolve) => {
      this.commonService
        .getInvData('bm.pisc.project.get', { project_info: [{ project_no }] })
        .subscribe((res: any): void => {
          resolve(res.data.project_info[0]);
        });
    });
  }

  /**
   * 更新任务流程
   * @param params 任务信息
   */
  updateTaskFlow(params: any, modelType: string, project_no: string, source?: string): void {
    if (modelType.indexOf('DTD') !== -1) {
      // 任务卡重推流程优化，应用场景：当非PLM_PROJECT类型的任务下发后，此时任务状态会是未开始，若PM此时调整任务类型为PLM_PROJECT时，重推任务卡时，需同步创建PLM项目
      if (params.project_status === '30' && params.is_issue_task_card) {
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
      param = [
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
    ).subscribe(() => {});
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

  projectCenterConsoleUpdateTask(params: any, project_no: string): void {
    const tenantId = this.userService.getUser('tenantId');
    const param = [
      {
        project_no,
        task_no: params.task_no,
        needToReset: true,
      },
    ];
    this.editTaskCard(tenantId, param, this.commonService.content).subscribe(() => {});
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
          liable_person_role_no: params.liable_person_role_no,
          liable_person_role_name: params.liable_person_role_name,
          responsibility_department_no: params.liable_person_department_code, // 负责人部门编号
          responsibility_department_name: params.liable_person_department_name, // 负责人部门名称
          task_member_info: params.task_member_info,
        },
      ],
    };
    this.commonService.getServiceOrchestration(orchestrationParam).subscribe(() => {});
  }
}
