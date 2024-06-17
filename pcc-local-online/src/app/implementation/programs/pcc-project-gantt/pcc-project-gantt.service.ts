import { Injectable } from '@angular/core';
import { CommonService } from '../../service/common.service';
import { Gantt } from 'dhtmlx-gantt';
import '../../plugins/export.dhtmlx.js';

let gantt: any;

@Injectable()
export class PccProjectGanttService {

  constructor(
    private commonService: CommonService
  ) {
    gantt = Gantt.getGanttInstance();
  }

  // 确保ts中引用的是同一个gantt实例
  getGanttInstance(): any {
    return gantt;
  }

  getData(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService.getInvData('multi.project.gantt.chart.info.get', params).subscribe((res): void => {
        resolve(res.data?.project_info);
      });
    });
  }

}
