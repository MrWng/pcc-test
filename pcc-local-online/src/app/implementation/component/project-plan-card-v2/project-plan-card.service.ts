import { Injectable } from '@angular/core';
import { DynamicWbsService } from '../wbs/wbs.service';
import { CommonService } from '../../service/common.service';

@Injectable()
export class ProjectPlanCardV2Service {
  constructor(public wbsService: DynamicWbsService, public commonService: CommonService) {}

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
}
