import { Injectable } from '@angular/core';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
import { CommonService } from 'app/implementation/service/common.service';

@Injectable()
export class TaskWbsListService {
  /**
   * 获取所有人员列表
   */
  personList: any = [];

  // 协同一级计划任务卡信息
  root_task_card = {
    root_task_no: '', // 根任务卡编号
    schedule_status: '', // 协助计划排定状态
    assist_schedule_seq: '', // 协助排定计划序号
  };
  constructor(public wbsService: DynamicWbsService, public commonService: CommonService) {}

  /**
   * 获取协同任务卡信息
   * @returns
   */
  async getAssistTaskDetailInfo(item: any = {}): Promise<any> {
    const task_info =
      this.commonService?.content?.executeContext?.taskWithBacklogData?.bpmData?.task_info;
    this.root_task_card.root_task_no = task_info[0]?.task_no;
    this.root_task_card.assist_schedule_seq = task_info[0]?.teamwork_plan_seq;
    const params = {
      query_condition: 'M1D1D2', // 查询范围
      level_type: '1', // 阶层类型
      assist_task_detail_info: [
        {
          // 协同排定任务明细信息
          assist_schedule_seq: task_info[0]?.teamwork_plan_seq, // 协助排定计划序号
          project_no: this.wbsService?.project_no, // 项目编号
          root_task_no: task_info[0]?.task_no, // 根任务编号
          task_no: item?.task_no ? item.task_no : null, // 任务编号
          is_delete: 'false', // 是否删除
        },
      ],
    };
    const res: any = await this.commonService
      .getInvData('bm.pisc.assist.task.detail.get', params)
      .toPromise();
    res?.data?.assist_task_detail_info.forEach((task: any): void => {
      task.task_status = task.old_task_status; // 原任务状态
      task.liable_person_code = task.responsible_person_no; // 负责人角色编号
      task.liable_person_name = task.responsible_person_name; // 负责人角色名称
      task.liable_person_department_code = task.responsibility_department_no; // 负责人部门编号
      task.liable_person_department_name = task.responsibility_department_name; // 负责人部门名称
      task.task_template_no = task.task_template_parameter_no; // 任务模板类型编号
      task.task_template_name = task.task_template_parameter_name; // 任务模板类型编号
      task.is_project_no = task.is_project_no; // 项目编号条件
      task.type_field_code = task.user_defined01; // 类型栏位代号
      task.type_condition_value = task.user_defined01_value; // 类型条件值
      task.sub_type_field_code = task.user_defined02; // 次类型栏位代号
      task.sub_type_condition_value = task.user_defined02_value; // 次类型条件值
      task.outsourcing_field_code = task.user_defined03; // 托外栏位代号
      task.outsourcing_condition_value = task.user_defined03_value; // 托外条件值
      task.report_work_description = task.report_description; // 报工说明
      task.seq = task.doc_seq; // 单据序號
      task.task_dependency_info = task.assist_task_dependency_info; // 协同排定任务依赖关系信息
      task.task_member_info = task.assist_task_member_info; // 协同排定任务执行人信息
      if (!item?.task_no) {
        task.disabled = true;
      }
    });
    if (!item?.task_no) {
      this.wbsService.allTaskCardList = res?.data?.assist_task_detail_info;
    }
    this.wbsService.hasCollaborationCard = res?.data?.assist_task_detail_info?.length;
    return res?.data?.assist_task_detail_info;
  }

  /**
   * 获取协同合作任务计划信息 (敏态)
   */
  async getAssistScheduleInfo(task_no: string): Promise<any> {
    const task_info =
      this.commonService?.content?.executeContext?.taskWithBacklogData?.bpmData?.task_info;
    const assist_schedule_info = [
      {
        project_no: this.wbsService.project_no, // 项目编号
        task_no, // 任务编号(一级计划的任务编号)
        assist_schedule_seq: task_info[0]?.teamwork_plan_seq, // 协助排定计划序号
      },
    ];
    const res: any = await this.commonService
      .getInvData('bm.pisc.assist.schedule.get', { assist_schedule_info })
      .toPromise();
    this.root_task_card.schedule_status = res?.data?.assist_schedule_info?.[0]?.schedule_status;
    return res?.data?.assist_schedule_info;
  }

  /**
   * 校验当前登录员工必是否是当前协同排定的一级计划的负责人
   * 获取前置根任务编号：入参：项目编号、查询范围=M1、阶层类型=1.全部、任务属性=1.项目、任务编号=前置任务编号
   */
  async getRootTaskInfo(task_no: string, project_no = this.wbsService.project_no): Promise<any> {
    const params = {
      query_condition: 'M1', // 查询范围 = M1
      level_type: '1', // 阶层类型 = 1.全部
      task_info: [
        {
          project_no, //  项目编号 = 项目编号
          task_property: '1', // 任务属性 = 1.项目
          task_no, // 任务编号 = 一级计划的任务编号
        },
      ],
    };
    const res: any = await this.commonService.getInvData('bm.pisc.task.get', params).toPromise();
    return {
      before_root_task_no: res?.data?.task_info?.[0]?.root_task_no,
      isCollaboratePlanOwner:
        res?.data?.task_info?.[0]?.responsible_person_no === this.wbsService.userInfo?.id,
    };
  }

  /**
   * 校验项目卡是否是签核中
   */
  async isProjectCardInApproval(): Promise<boolean> {
    const project_info = [{ project_no: this.wbsService.project_no }];
    const res: any = await this.commonService
      .getInvData('bm.pisc.project.get', { project_info })
      .toPromise();
    this.wbsService.projectInfo = res?.data?.project_info[0];
    return this.wbsService.projectInfo?.approve_status === 'N';
  }

  /**
   *  协同排定任务提交
   * @returns
   */
  async submitCollaborateTask(task_no): Promise<any> {
    const hasGroundEnd = await this.commonService
      .hasDependsGround()
      .toPromise()
      .then((res) => res.data.hasGroundEnd);
    const isSyncDoc = await this.wbsService.getSyncDoc();
    const task_info =
      this.commonService?.content?.executeContext?.taskWithBacklogData?.bpmData?.task_info;
    const params = {
      is_sync_document: isSyncDoc,
      sync_steady_state: hasGroundEnd, // 同步稳态 = 交付设计器.是否依赖地端
      assist_schedule_info: [
        {
          project_no: this.wbsService.project_no, // 项目编号
          task_no, // 任务编号 = 一级任务编号
          assist_schedule_seq: task_info[0]?.teamwork_plan_seq, // 协助排定计划序号
        },
      ],
    };
    const res: any = await this.commonService
      .getInvData('assist.task.submit.process', params)
      .toPromise();
    return res?.data?.assist_schedule_info?.[0];
  }
}
