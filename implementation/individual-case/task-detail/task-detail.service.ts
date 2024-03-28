import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { TranslateService } from '@ngx-translate/core';
import { DwUserService } from '@webdpt/framework/user';
import { map, pluck } from 'rxjs/operators';
import * as moment from 'moment';
import { CommonService } from 'app/implementation/service/common.service';
import { FROM_GROUP_KEY } from './config';

@Injectable()
export class TaskDetailService {
  uibotUrl: string;
  knowledgeMapsUrl: string;
  // 记录机制的content参数
  content: any;
  smartDataUrl;
  atmcUrl;
  qianyeTenantId;
  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    protected translateService: TranslateService,
    private userService: DwUserService,
    public commonService: CommonService
  ) {
    this.configService.get('uibotUrl').subscribe((url: string): void => {
      this.uibotUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
    this.configService.get('knowledgeMapsUrl').subscribe((url: string): void => {
      this.knowledgeMapsUrl = url;
    });
    this.configService.get('atmcUrl').subscribe((url: string): void => {
      this.atmcUrl = url;
    });
    this.configService.get('qianyeTenantId').subscribe((url: string) => {
      const id = url || '72007522,72007522_001';
      this.qianyeTenantId = id.split(',');
    });
  }
  getTaskId(params: any): Observable<any> {
    const url = `${this.smartDataUrl}/DataFootprint/task/queryByState`;
    return this.http.post(url, params, {
      headers: this.commonService.getHeader(),
    });
  }
  getWorkReport(params: any) {
    const { taskDetail, process_status } = params;
    const master = [
      this.transformParams({
        project_no: taskDetail.project_no,
        task_no: taskDetail.task_no,
        process_status,
      }),
    ];
    return this.http
      .post('http://127.0.0.1:4523/m2/3569931-0-default/159388387', master)
      .pipe(
        map((res: any) => {
          console.log(res);
          return res?.master || [];
        })
      )
      .toPromise();
    // return this.commonService
    //   .getInvData('wo.work.report.get', {
    //     master,
    //   })
    //   .toPromise();
  }
  createTreeField(data = []) {
    const flatteningData = [];
    data.forEach((item) => {
      const { detail, ...rest } = item,
        newDetailData = [];
      rest['treeTablePath'] = [rest.sffb005];
      detail.forEach((dItem) => {
        newDetailData.push(
          this.apiDataToTableSchema({
            ...dItem,
            treeTablePath: [rest.sffb005, dItem.sffbdocno],
          })
        );
      });
      flatteningData.push(this.apiDataToTableSchema(rest));
      flatteningData.push(...newDetailData);
    });
    return {
      [FROM_GROUP_KEY]: flatteningData,
    };
  }
  apiDataToTableSchema(data = {}) {
    const keyMap = {
      sffb005: 'ticketsTickets',
      sffbdocno: 'ticketsTickets',
      sffb014: 'manHour',
      sffb009_desc: 'workstation',
      sffb009_type: 'workstationType',
      sncode_d: 'snNumber',
      sncode_m: 'snNumber',
      zjbfb: 'percentageOfTheWholeMachine',
      state: 'completionStatus',
      sfaa020: 'endDate',
      sfaa019: 'startDate',
    };
    const result = {};
    Object.keys(data || {}).forEach((key) => {
      result[keyMap[key] || key] = data[key];
    });
    return result;
  }
  transformParams(params) {
    const keyMap = {
      project_no: 'sfaa028',
      task_no: 'task_wbs',
      eoc_company_id: 'yunduan1',
      eoc_site_id: 'yunduan2',
      eoc_region_id: 'yunduan3',
      plan_start_date: 'sfaa019',
      plan_finish_date: 'sfaa020',
      doc_condition_value: 'danbie',
      item_operator: 'ljysf',
      item_condition_value: 'ljtj',
      is_doc_date: 'flag_djrq',
      is_confirm_date: 'flag_qrrq',
      is_project_no: 'flag_xiangmu',
      is_task_no: 'flag_task',
      process_status: 'state',
    };
    const result = {};
    Object.keys(params || {}).forEach((key) => {
      result[keyMap[key]] = params[key];
    });
    return result;
  }
}
