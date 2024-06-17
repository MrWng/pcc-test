import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Gantt } from 'dhtmlx-gantt';
import '../../plugins/export.dhtmlx.js';

let gantt: any;
@Injectable()
export class GanntService {

  constructor() {
    gantt = Gantt.getGanttInstance();
  }

  // 确保ts中引用的是同一个gantt实例
  getGanttInstance(): any {
    return gantt;
  }

  /**
   * 把wbs的数据转换成gantt格式
   * @param data 数据入参
   * */
  transformData(data: any[], criticalPath: any): any {
    let tempLinks = [];
    return data.reduce(
      (prev, cur): any => {
        const temp_data = {};
        const plan_finish_date = JSON.parse(JSON.stringify(cur.plan_finish_date));
        temp_data['id'] = cur.task_no;
        temp_data['text'] = cur.task_name;
        // 上阶任务编号 = 当前任务编号 表示是第一阶任务
        temp_data['parent'] = cur.upper_level_task_no === cur.task_no ? 0 : cur.upper_level_task_no;
        temp_data['start_date'] = cur.plan_start_date;
        temp_data['end_date'] = plan_finish_date
          ? moment(plan_finish_date).add(1, 'days').format('YYYY-MM-DD')
          : plan_finish_date;
        temp_data['progress'] = cur.complete_rate_gatter;
        // 默认是task，如果is_milepost === Y，则是里程碑，暂无project的情况
        temp_data['type'] = cur.is_milepost === 'Y' ? 'milestone' : 'task';
        temp_data['plan_finish_date'] = cur.plan_finish_date
          ? moment(cur.plan_finish_date).format('YYYY-MM-DD')
          : '';
        temp_data['actual_start_date'] = cur.actual_start_date
          ? moment(cur.actual_start_date).format('YYYY-MM-DD')
          : '';
        temp_data['actual_finish_date'] = cur.actual_finish_date
          ? moment(cur.actual_finish_date).format('YYYY-MM-DD')
          : '';
        temp_data['plan_work_hours'] = cur.plan_work_hours;
        temp_data['actual_work_hours'] = cur.actual_work_hours;
        temp_data['complete_rate'] = cur.complete_rate
          ? `${cur.complete_rate}%`
          : cur.complete_rate;
        temp_data['remaining_work_hours'] = cur.remaining_work_hours;
        temp_data['work_hours_difference'] = cur.work_hours_difference;
        temp_data['time_out_status'] = cur.time_out_status;
        temp_data['overdue_days'] = cur.overdue_days;
        temp_data['schedule_status'] = cur.schedule_status;
        temp_data['liable_person_department_name'] = cur.liable_person_department_name;
        temp_data['liable_person_name'] = cur.liable_person_name;
        temp_data['total_work_hours'] = cur.total_work_hours;
        temp_data['remarks'] = cur.remarks;
        temp_data['owner_id'] = this.getOwnerId(cur);
        temp_data['isCriticalPath'] = this.showCriticalPath(cur, criticalPath);
        temp_data['open'] = true;
        temp_data['unscheduled'] = cur.plan_start_date ? false : true;
        // 测试, 效果待定
        const actualDependency = cur?.task_dependency_info.filter(
          (v) => v.after_task_no === cur.task_no
        );
        if (actualDependency.length > 0) {
          const arr = [];
          actualDependency.forEach((s, actualIndex) => {
            arr.push({
              id: `${tempLinks.length + actualIndex + 1}`,
              source: s.before_task_no,
              target: cur.task_no,
              unique: s.before_task_no + '-' + cur.task_no,
              type: '1',
            });
          });
          tempLinks = [...prev.links, ...arr];
          return { data: [...prev.data, temp_data], links: [...prev.links, ...arr] };
        } else {
          return { data: [...prev.data, temp_data], links: [...prev.links] };
        }
      },
      { data: [], links: [] }
    );
  }

  /**
   * id : 1 未逾期  2已逾期  3已完成已逾期  4已完成未逾期
   */
  getOwnerId(arr) {
    let id;
    if (arr.isOverdue) {
      id = arr.task_status === 30 ? 3 : 2;
    } else {
      id = arr.task_status === 30 ? 4 : 1;
    }
    return id;
  }

  // 判断是否为关键路径的点
  showCriticalPath(taskinfo: any, criticalPath: any): any {
    let isCriticalPath;
    criticalPath.forEach((item: any) => {
      isCriticalPath = item.source === taskinfo.task_no || item.target === taskinfo.task_no ? true : false;
    });
    return isCriticalPath;
  }
}
