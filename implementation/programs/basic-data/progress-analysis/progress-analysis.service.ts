import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { CommonService } from '../../../service/common.service';
import { gantt } from 'dhtmlx-gantt';

@Injectable({
  providedIn: 'root',
})
export class ProgressAnalysisService {
  atdmUrl: string;
  bpmUrl: string;
  uibotUrl: string;
  isShowProjectAnalysis: boolean = true;
  searchProjectInfo: any;
  taskAnalysisSpin: boolean = true;
  ganttStatus: boolean = false;
  $projectInfo = new Subject();
  $ganttData = new Subject();

  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    public commonService: CommonService
  ) {
    this.configService.get('atdmUrl').subscribe((url: string): void => {
      this.atdmUrl = url;
    });
    this.configService.get('bpmUrl').subscribe((url) => {
      this.bpmUrl = url;
    });
    this.configService.get('uibotUrl').subscribe((url: string): void => {
      this.uibotUrl = url;
    });
  }

  getTaskAnalysisInfo(): void {
    const projectNo = this.searchProjectInfo?.project_no || '';
    const params = {
      task_info: [
        {
          project_no: projectNo, // projectNo
        },
      ],
    };
    this.commonService
      .getInvData('task.schedule.analysis.info.get', params)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.taskAnalysisSpin = false;
          this.ganttStatus = true;
          this.$projectInfo.next(res.data);
        }
      });
  }
}
