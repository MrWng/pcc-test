import { Injectable } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { cloneDeep } from '@athena/dynamic-core';
import { OpenWindowService } from '@athena/dynamic-ui';
import { TranslateService } from '@ngx-translate/core';
import { DwUserService } from '@webdpt/framework/user';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { observable, Observable } from 'rxjs';
import { AddSubProjectCardService } from '../add-subproject-card.service';
import { AdvancedOptionService } from './advanced-option.service';
import { DynamicWbsService } from '../../wbs/wbs.service';
import { AthModalService } from '@athena/design-ui';

type ICheckValueParams = {
  personLiable: any;
  executor: any;
  taskTemplateInfo: any;
  pageDatas: any;
  changeReason: any;
  source: any;
  projectInfo: any;
};

type ICheckValueResult = {
  /** 校验状态 */
  status: 'fail' | 'success';
  /** 需要回显设置的变量 */
  setData?: {
    [key: string]: any;
  };
  /** 返回的数据 */
  response?: {
    [key: string]: any;
  };
};

type IHandeDataParams = {
  taskTemplateInfo: any;
  taskClassificationForm: any;
  project_no: string;
  taskDependencyInfoList: any;
  source: string;
  attachmentData: any;
  changeReason: any;
  change_attachment?: any;
  hasGroundEnd: any;
  tempCurrentData: any;
  difficultyLevelForm: any;
  task_member_infoList: any;
  pageDatas: any;
  personList: any;
};

type IHandeDataResult = {
  /** 提交表单需要的参数 */
  params;
  /** 单别信息 */
  temp_doc_condition_value;
};

@Injectable()
export class SubmitCardService {
  isUnique: boolean;

  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    public commonService: CommonService,
    public wbsService: DynamicWbsService,
    public translateService: TranslateService,
    public openWindowService: OpenWindowService,
    private fb: FormBuilder,
    private userService: DwUserService,
    private messageService: NzMessageService,
    private athModalService: AthModalService,
    public advancedOptionService: AdvancedOptionService
  ) {}

  /**
   * 校验表单值
   * @returns
   */
  checkValue(enterParams: ICheckValueParams): ICheckValueResult {
    const {
      personLiable,
      executor,
      taskTemplateInfo,
      pageDatas,
      changeReason,
      source,
      projectInfo,
    } = enterParams;
    // 校验
    const { validateForm } = this.addSubProjectCardService;
    const params = validateForm.getRawValue();
    // 校验：[品号类别/群组]有值，[品号类别条件值]不能为空
    if (
      validateForm.controls['item_type'].value === '0' &&
      !validateForm.controls['item_type_value'].value
    ) {
      return;
    }
    // 校验是否通过
    if (validateForm.invalid) {
      return;
    }
    // 校验主单位
    if (
      params.main_unit !== '0' &&
      (params.plan_main_unit_value === '' || !(params.plan_main_unit_value > 0))
    ) {
      if (!(params.plan_main_unit_value > 0)) {
        this.advancedOptionService.planMainUnitValue = true;
        return {
          status: 'fail',
        };
      }
      return;
    }
    // 校验次单位
    if (
      params.second_unit !== '0' &&
      (params.plan_second_unit_value === '' || !(params.plan_second_unit_value > 0))
    ) {
      if (!(params.plan_second_unit_value > 0)) {
        this.advancedOptionService.planSecondUnitValue = true;
        return {
          status: 'fail',
        };
      }
      return;
    }
    // 负责人、执行人选项 出现错误提示时 禁止确定
    if (personLiable.employee_info?.length || executor.employee_info.length) {
      return;
    }
    if (
      params.doc_no &&
      params.doc_type_no &&
      params.sub_type_condition_value &&
      params.type_condition_value &&
      taskTemplateInfo?.task_category === 'MO_H'
    ) {
      this.isUnique = false;
      this.checkUnique(params, pageDatas);
      if (this.isUnique) {
        this.messageService.error(
          this.translateService.instant(
            `dj-pcc-任务类型工单工时下单别、单号、类型条件值、次类型条件值非唯一性`
          )
        );
        return {
          status: 'fail',
          setData: {
            valueNotUnique: false,
          },
        };
      }
    }
    // 校验工期
    if (isNaN(params.workload_qty)) {
      this.messageService.error(
        this.translateService.instant(`dj-default-工期只可以为数字，请修正！`)
      );
      return;
    }
    // 校验日期
    params.plan_start_date = params.plan_start_date
      ? moment(params.plan_start_date).format('YYYY-MM-DD')
      : '';
    params.plan_finish_date = params.plan_finish_date
      ? moment(params.plan_finish_date).format('YYYY-MM-DD')
      : '';
    if (params.plan_start_date && params.plan_finish_date) {
      const diff = moment(params.plan_finish_date).diff(moment(params.plan_start_date), 'days') + 1;
      if (diff <= 0) {
        this.messageService.error(
          this.translateService.instant('dj-default-开始时间必须早于结束时间')
        );
        return;
      }
    }
    // 校验款项阶段是否选择
    if (
      taskTemplateInfo?.task_category === 'ODAR' &&
      !this.addSubProjectCardService.arStageNo &&
      !this.addSubProjectCardService.arStageName
    ) {
      this.messageService.error(this.translateService.instant('dj-default-请选择款项阶段'));
      return;
    }
    if (source === Entry.collaborate && this.addSubProjectCardService.firstLevelTaskCard) {
      const {
        root_task_plan_start_date: plan_start_date,
        root_task_plan_finish_date: plan_finish_date,
      } = this.addSubProjectCardService.firstLevelTaskCard;
      // s17: 交付设计器日期管控
      if (
        params.plan_start_date &&
        plan_start_date &&
        this.addSubProjectCardService.dateCheck === '1' &&
        params.plan_start_date < moment(plan_start_date).format('YYYY-MM-DD')
      ) {
        this.messageService.error(
          this.translateService.instant(
            `dj-pcc-开始日期不可早于任务内一级计划的开始日期(API-95的原根任务预计开始日期)`
          ) + `(${plan_start_date})！`
        );
        return;
      }
      // s17: 交付设计器日期管控
      if (
        params.plan_finish_date &&
        plan_finish_date &&
        this.addSubProjectCardService.dateCheck === '1' &&
        params.plan_finish_date > moment(plan_finish_date).format('YYYY-MM-DD')
      ) {
        this.messageService.error(
          this.translateService.instant(
            `dj-pcc-结束日期不可晚于任务内一级计划的结束日期(API-95的原根任务预计结束日期)`
          ) + `(${plan_finish_date})！`
        );
        return;
      }
    }

    Object.values(validateForm.controls).forEach((validateFormItme: any): void => {
      validateFormItme.markAsDirty();
      validateFormItme.updateValueAndValidity();
    });
    // 计划维护入口：项目状态为进行中（30）,需输入变更原因
    const condition2 =
      (source === Entry.card || source === Entry.collaborate) &&
      Number(projectInfo.project_status) === 30;
    const status = condition2 && this.addSubProjectCardService.buttonType !== 'EDIT' ? true : false;
    return {
      status: 'success',
      response: {
        condition2,
        status,
      },
    };
    // condition2 && this.addSubProjectCardService.buttonType === 'EDIT' ? changeReason.showModal() : this.handelData({ status });
  }

  /**
   * 任务类型为MO_H时，该项目卡内单别、单号、类型条件值、次类型条件值唯一性检查
   */
  checkUnique(target: any, taskData: any): void {
    taskData.some((item: any) => {
      if (this.matchRules(item, target) || this.isUnique) {
        this.isUnique = true;
        return true;
      }
      if (item.children.length) {
        this.checkUnique(target, item.children);
      }
    });
  }

  matchRules(item: any, target: any): boolean {
    return (
      item.task_no !== target.task_no &&
      item.doc_no === target.doc_no &&
      item.doc_type_no === target.doc_type_no &&
      item.sub_type_condition_value === target.sub_type_condition_value &&
      item.type_condition_value === target.type_condition_value
    );
  }

  /**
   * 获取入参 提交内容
   * @param changeReason
   */
  handelData(enterParams: IHandeDataParams): IHandeDataResult {
    const {
      taskTemplateInfo,
      taskClassificationForm,
      project_no,
      taskDependencyInfoList,
      source,
      attachmentData,
      changeReason,
      change_attachment,
      hasGroundEnd,
      tempCurrentData,
      difficultyLevelForm,
      task_member_infoList,
      pageDatas,
      personList,
    } = enterParams;

    let params = this.addSubProjectCardService.validateForm.getRawValue();
    // 是否录入变更原因
    params.record_task_change = changeReason.status;
    // 变更原因
    params.change_reason = changeReason?.value;
    if (change_attachment) {
      params.change_attachment = change_attachment;
    }
    if (taskTemplateInfo?.task_category !== 'ODAR') {
      this.addSubProjectCardService.arStageNo = '';
      this.addSubProjectCardService.arStageName = '';
    }
    params.project_no = project_no;
    params.sequence = this.addSequence([tempCurrentData], params, pageDatas);
    if (!params.liable_person_code && params.liable_person_code_data) {
      // if ((source === Entry.collaborate) && (params.liable_person_code || params.liable_person_code_data)) {
      // 格式参考："id:pvq017;name:erp内勤1;deptId:C001;deptName:仓管部;roleNo:;roleName:無角色"
      const arr1 = params.liable_person_code_data.split(';');
      const item = {};
      arr1.forEach((v) => {
        const temp = v.split(':');
        item[temp[0]] = temp[1];
      });
      params.liable_person_code = item['id'];
      params.liable_person_name = item['name'];
      params.liable_person_department_code = item['deptId'];
      params.liable_person_department_name = item['deptName'];
      params.liable_person_role_no = item['roleNo'];
      params.liable_person_role_name = item['roleName'];
    }
    // 处理多执行人入参
    if (params.task_member_info?.length) {
      if (params.task_member_info[0].indexOf(':') < 0) {
        const tempTaskMemberInfo = params.task_member_info.filter((res) => res);
        params.task_member_info = this.setMember(params, task_member_infoList, personList);
      } else {
        const arr = [];
        params.task_member_info.forEach((element) => {
          const arr1 = element.split(';');
          const item = {};
          arr1.forEach((v) => {
            const temp = v.split(':');
            item[temp[0]] = temp[1];
          });

          arr.push({
            executor_role_name: item['roleName'] ? item['roleName'] : '',
            executor_role_no: item['roleNo'] ? item['roleNo'] : '',
            executor_department_name: item['deptName'],
            executor_department_no: item['deptId'],
            executor_name: item['name'],
            executor_no: item['id'],
            project_no: params.project_no,
            task_no: params.task_no,
          });
        });
        params.task_member_info = arr;
      }
    } else {
      params.task_member_info = [];
    }
    // 处理前置任务多选
    params.task_dependency_info = [];
    taskDependencyInfoList?.forEach((item: any, index: number) => {
      item.advance_lag_type = Number(item.advance_lag_type);
      if (item.before_task_no) {
        const data = {
          ...item,
          project_no: params.project_no,
          after_task_no: params.task_no || '',
        };
        delete data?.default_before_task_no;
        params.task_dependency_info.push(data);
      }
    });

    // 处理单别条件值
    let temp_doc_condition_value = '';

    // 如果单别条件值为对象转成数组
    if (
      params.doc_type_info &&
      Object.prototype.toString.call(params.doc_type_info) === '[object Object]'
    ) {
      params.doc_type_info = [params.doc_type_info];
    }
    if (params.doc_type_info?.length) {
      temp_doc_condition_value = params.doc_type_info
        .filter((o) => o.doc_condition_value)
        ?.map((o) => o.doc_condition_value)
        ?.join();
      params.doc_type_info = params.doc_type_info.map((doc) => {
        if (Object.getOwnPropertyNames(doc).find((item) => item === 'doc_condition_value')) {
          return doc;
        } else {
          return { doc_condition_value: doc };
        }
      });
    }
    params.task_template_no = this.addSubProjectCardService.taskTemplateNo || '';
    params.task_template_name = this.addSubProjectCardService.taskTemplateName || '';
    params.task_category = taskTemplateInfo?.task_category || '';
    params.eoc_company_id = this.addSubProjectCardService.eocCompanyId?.id || '';
    params.eoc_site_id = this.addSubProjectCardService.eocSiteId?.id || '';
    params.eoc_region_id = this.addSubProjectCardService.eocRegionId?.id || '';
    params.ar_stage_no = this.addSubProjectCardService.arStageNo || '';
    params.ar_stage_name = this.addSubProjectCardService.arStageName || '';
    params.is_equipment_list_unfold =
      source === Entry.card || source === Entry.projectChange
        ? null
        : params.is_equipment_list_unfold;
    params = this.getInvisibleField(params, taskTemplateInfo);
    // params.complete_rate_method = params.complete_rate_method ? params.complete_rate_method : '1';
    params.complete_rate_method = taskTemplateInfo.complete_rate_method
      ? taskTemplateInfo.complete_rate_method
      : '1';
    const aList = [];
    if (attachmentData && attachmentData.length) {
      attachmentData.forEach((file) => {
        if (file.status === 'done') {
          aList.push({
            id: file.id,
            name: file.name,
            category: file.category,
            categoryId: file.categoryId,
            upload_user_name: file.upload_user_name,
            upload_user_id: file.upload_user_id,
            size: file.size,
            // url: file.url,
            create_date: file.create_date,
            // lastModified: file.lastModified,
            row_data: file.row_data,
          });
        }
      });
    }
    params.attachment = {
      data: aList,
      row_data:
        params.project_no + ';' + (this.addSubProjectCardService.currentCardInfo as any).task_no,
    };
    params.task_status = String(params.task_status);
    const classificationType = JSON.parse(
      taskClassificationForm?.value?.classificationType || '{}'
    );
    params.task_classification_no = classificationType?.task_classification_no ?? '';
    params.task_classification_name = classificationType?.task_classification_name ?? '';
    const difficultyLevelObj = JSON.parse(difficultyLevelForm?.value?.difficultyLevelObj || '{}');

    params.difficulty_level_no = difficultyLevelObj?.difficulty_level_no ?? ''; // 难度等级
    params.difficulty_level_name = difficultyLevelObj?.difficulty_level_name ?? '';
    params.difficulty_coefficient = difficultyLevelObj?.difficulty_coefficient ?? '';
    params.task_proportion = this.commonService.accDiv(params.task_proportion, 100); // 任务比重
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
    // 若交付設計器.是否依賴地端=true傳入Y否則傳入N
    params.sync_steady_state = hasGroundEnd !== 'Y' ? null : 'Y'; // 同步稳态	Y.同步；N.不同步 不传或传null，默认Y
    if (source !== Entry.maintain) {
      params.operation_no = this.userService.getUser('userId');
      params.operation_name = this.userService.getUser('userName');
    }
    return {
      params,
      temp_doc_condition_value,
    };
  }

  /**
   * 添加sequence序号
   * currentData： 一级，当前树
   * params： 当前任务卡
   */
  addSequence(currentData: any, params: any, pageDatas): number {
    let sequenceNum: number = 1;
    const upper_level_task_no_old = (this.addSubProjectCardService.currentCardInfo as any)
      .upper_level_task_no;
    if (
      this.addSubProjectCardService.buttonType === 'CREATE' ||
      (this.addSubProjectCardService.buttonType === 'ADD' && !params.upper_level_task_no)
    ) {
      // 新增一级计划
      const taskGroupLength = pageDatas?.length ?? 0;
      sequenceNum = taskGroupLength ? pageDatas[taskGroupLength - 1].sequence + 1 : 1;
    } else if (
      params.upper_level_task_no &&
      params.task_no !== params.upper_level_task_no &&
      params.upper_level_task_no !== upper_level_task_no_old
    ) {
      const brother = this.wbsService.findChildrenTaskInfo(params.upper_level_task_no);
      let maxSequence = 0;
      brother.forEach((item) => {
        if (item.sequence > maxSequence) {
          maxSequence = item.sequence;
        }
      });
      sequenceNum = maxSequence + 1;
    } else {
      sequenceNum = params.sequence;
    }
    return sequenceNum;
  }

  /**
   * 处理多执行人
   * @param params
   * @returns
   */
  setMember(params, task_member_infoList, personList) {
    const arr = [];
    const { task_member_info = [] } = this.addSubProjectCardService.validateForm.getRawValue();
    if (task_member_info?.length) {
      task_member_info.forEach((res) => {
        let hasPeople = false;
        task_member_infoList.forEach((infoListItem: any): void => {
          if (infoListItem.bigId === res) {
            hasPeople = true;
            arr.push({
              executor_role_name: infoListItem.roleName ? infoListItem.roleName : '',
              executor_role_no: infoListItem.roleNo ? infoListItem.roleNo : '',
              executor_department_name: infoListItem.deptName,
              executor_department_no: infoListItem.deptId,
              executor_name: infoListItem.name,
              executor_no: infoListItem.id,
              project_no: params.project_no,
              task_no: params.task_no,
            });
          }
        });
        if (!hasPeople) {
          personList.forEach((personListItem: any): void => {
            personListItem?.list?.forEach((item: any): void => {
              if (item.bigId === res) {
                arr.push({
                  executor_role_name: item.roleName ? item.roleName : '',
                  executor_role_no: item.roleNo ? item.roleNo : '',
                  executor_department_name: item.deptName,
                  executor_department_no: item.deptId,
                  executor_name: item.name,
                  executor_no: item.id,
                  project_no: params.project_no,
                  task_no: params.task_no,
                });
              }
            });
          });
        }
      });
    }
    return arr;
  }

  /**
   * 不可见的C区
   * @param params
   * @returns
   */
  getInvisibleField(params: any, taskTemplateInfo: any = {}): any {
    const invisibleList = [
      'is_doc_date',
      'is_confirm_date',
      'is_project_no',
      'is_task_no',
      'complete_rate_method',
      'type_field_code',
      'sub_type_field_code',
      'outsourcing_field_code',
      'user_defined01',
      'user_defined02',
      'user_defined03',
    ];

    const invisibleData = {
      is_confirm_date: false,
      is_doc_date: false,
      is_project_no: false,
      is_task_no: false,
      complete_rate_method: '1',
      type_field_code: '',
      sub_type_field_code: '',
      outsourcing_field_code: '',
      task_category: 'ORD',
      user_defined01: '',
      user_defined02: '',
      user_defined03: '',
    };
    if (params.task_category === 'ORD' || !params.task_category) {
      params = Object.assign(params, invisibleData);
    } else {
      Object.keys(taskTemplateInfo).forEach((control: string): void => {
        if (invisibleList.includes(control)) {
          params[control] = taskTemplateInfo[control];
        }
      });
      params.type_field_code = taskTemplateInfo.changeTemplateInfo
        ? taskTemplateInfo.user_defined01
        : params.type_field_code;
      params.sub_type_field_code = taskTemplateInfo.changeTemplateInfo
        ? taskTemplateInfo.user_defined02
        : params.sub_type_field_code;
      params.outsourcing_field_code = taskTemplateInfo.changeTemplateInfo
        ? taskTemplateInfo.user_defined03
        : params.outsourcing_field_code;
    }
    return params;
  }
}
