import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '../../../../../service/common.service';
import { OpenWindowService } from '@athena/dynamic-ui';
import { ProgressAnalysisService } from '../../progress-analysis.service';
import { multiple, subtract } from '@athena/dynamic-core';
import { DynamicWbsService } from '../../../../../component/wbs/wbs.service';

@Component({
  selector: 'app-task-analysis',
  templateUrl: './task-analysis.component.html',
  styleUrls: ['./task-analysis.component.less'],
})
export class TaskAnalysisComponent implements OnInit {
  @Output() currentTaskInfo = new EventEmitter();

  allProjectList: any[] = [];
  projectListOfOption: any[] = [];
  projectInfo: any ={};
  taskAnalysisInfo: any;
  projectLeaderName: string = '';
  planFinishDate: string = '';

  constructor(
    private translateService: TranslateService,
    protected changeRef: ChangeDetectorRef,
    public commonService: CommonService,
    public wbsService: DynamicWbsService,
    public openWindowService: OpenWindowService,
    public progressAnalysisService: ProgressAnalysisService
  ) {}

  ngOnInit(): void {
    this.getAllProjectList();
    this.getCurrentTaskAnalysis();
  }

  getCurrentTaskAnalysis(): void {
    this.progressAnalysisService.$projectInfo.subscribe((res: any): void => {
      this.taskAnalysisInfo = res.task_schedule_info[0];
      this.taskAnalysisInfo.totoal_task_count = this.thousandTransfer(
        this.taskAnalysisInfo.totoal_task_count
      );
      this.taskAnalysisInfo.total_remaining_work_hours = this.thousandTransfer(
        this.taskAnalysisInfo.total_remaining_work_hours
      );
      this.taskAnalysisInfo.actual_complete_task_count = this.thousandTransfer(
        this.taskAnalysisInfo.actual_complete_task_count
      );
      this.taskAnalysisInfo.plan_complete_task_count = this.thousandTransfer(
        this.taskAnalysisInfo.plan_complete_task_count
      );
      this.taskAnalysisInfo.currentStatus = multiple(
        subtract(
          this.taskAnalysisInfo.actual_complete_rate,
          this.taskAnalysisInfo.plan_complete_rate
        ),
        100
      );
      this.projectInfo = this.progressAnalysisService.searchProjectInfo?.project_no;
      this.projectLeaderName = this.progressAnalysisService.searchProjectInfo?.project_leader_name;
      this.planFinishDate = this.progressAnalysisService.searchProjectInfo?.plan_finish_date;
      this.changeRef.markForCheck();
    });
  }

  getGanttData(){
    return this.wbsService.ganttData;
  }

  getAllProjectList(): void {
    const params = {
      project_info: [
        {
          project_id: '',
        },
      ],
    };
    this.commonService
      .getInvData('display.project.info.get', params)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.allProjectList = res.data.project_info.map((item: any): void => {
            return {
              ...item,
              label: item.project_name,
              value: item.project_no,
            };
          });
        }
      });
  }

  findInfoFromAllProjectList(): void {
    const info = this.allProjectList.filter((item) => item.project_no === this.projectInfo);
    this.projectLeaderName = info[0].project_leader_name;
    this.planFinishDate = info[0].plan_finish_date;
    this.changeRef.markForCheck();
  }

  projectInfoChange(project: object): void {
    this.progressAnalysisService.taskAnalysisSpin = true;
    this.progressAnalysisService.ganttStatus = false;
    this.progressAnalysisService.searchProjectInfo = {};
    this.projectInfo = project;
    this.progressAnalysisService.searchProjectInfo.project_no = project;
    this.progressAnalysisService.getTaskAnalysisInfo();
    this.findInfoFromAllProjectList();
  }

  thousandTransfer(num: number): string {
    return (num + '').replace(/(\d{1,3})(?=(\d{3})+(?:$|\.))/g, '$1,');
  }

  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }
}
