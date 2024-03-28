import { Injectable } from '@angular/core';
import { CommonService, Entry } from 'app/customization/task-project-center-console/service/common.service';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { WbsTabsService } from '../../wbs-tabs/wbs-tabs.service';
import { AddSubProjectCardService } from '../add-subproject-card.service';

@Injectable()
export class WorkLoadService {
  WorkloadUnit = {
    '1': 'HOUR', // 小时
    '2': 'DAY', // 天
    '3': 'MONTH'// 日
  }

  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    public commonService: CommonService,
    public wbsTabsService: WbsTabsService,
  ) { }


  /**
   * 计算预计工时
   * @param workload_unit 工期单位
   * @param workload_qty 工期
   * @returns 预计工时
   */
  calculatePlanWorkHours(workload_unit: string, workload_qty: number): number {
    const calculateRule = {
      'HOUR': workload_qty,
      'DAY': 8 * workload_qty,
      'MONTH': 8 * 22 * workload_qty
    };
    return calculateRule[this.WorkloadUnit[workload_unit]];
  }

  /**
   * 计算结束日期
   * @param workload_unit 工期单位
   * @param workload_qty 工期
   * @param start_time 开始日期
   * @returns 结束日期
   */
  calculatePlanFinishDate(workload_unit: string, workload_qty: number, start_time: string): string {
    workload_qty = Number(workload_qty);
    start_time = moment(start_time).format('YYYY-MM-DD');
    const calculateRule = {
      'HOUR': Math.ceil(workload_qty / 24) < 1 ? '' : moment(start_time).add(Math.ceil(workload_qty / 24) - 1, 'days').format('YYYY-MM-DD'),
      'DAY': workload_qty < 1 ? '' : moment(start_time).add(workload_qty - 1, 'days').format('YYYY-MM-DD'),
      'MONTH': moment(start_time).add(workload_qty, 'month').format('YYYY-MM-DD')
    };
    return calculateRule[this.WorkloadUnit[workload_unit]];
  }

  /**
    * 日期同值
    * @param type
    * @returns
    */
  // setSameValue(type, this.wbsService.project_no, this.source, this.task_member_info)
  setSameValue(project_no, source): Observable<boolean> {
    return new Observable(observable => {
      const currentCardInfo = this.addSubProjectCardService.currentCardInfo;
      const {
        plan_start_date,
        plan_finish_date,
        workload_qty,
        workload_unit,
        plan_work_hours
      } = this.addSubProjectCardService.validateForm.value;
      if ((currentCardInfo.task_status !== '10' && source === Entry.card) || this.addSubProjectCardService.buttonType !== 'EDIT') {
        observable.next(false);
        return;
      }
      let params: any = {};
      // 项目编号，任务编号，预计开始日，预计完成日
      params = {
        site_no: '',
        enterprise_no: '',
        sync_steady_state: this.wbsTabsService.hasGroundEnd,
        project_info: [{
          project_no,
          task_no: currentCardInfo.task_no,
          plan_start_date,
          plan_finish_date,
          workload_qty,
          workload_unit,
          plan_work_hours,
          task_property: source === Entry.maintain ? '2' : '1',
        }]
      };
      if (plan_start_date || plan_finish_date) {
        this.commonService
          .getInvData('lower.level.task.info.update', params)
          .subscribe((res: any): void => {
            const task_info = res.data?.task_info?.filter(item => item?.is_issue_task_card);
            if (task_info.length && source !== Entry.maintain) {
              this.addSubProjectCardService.updateTaskMainProject(task_info, '', true);
            }
            observable.next(true);
          }, err => {
            observable.next(false);
          });
      }
    });
  }
}
