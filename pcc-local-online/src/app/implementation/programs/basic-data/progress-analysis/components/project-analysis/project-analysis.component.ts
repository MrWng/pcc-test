import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '../../../../../service/common.service';
import { cloneDeep, multiple, subtract } from '@athena/dynamic-core';
import { OpenWindowService } from '@athena/dynamic-ui';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ProgressAnalysisService } from '../../progress-analysis.service';
@Component({
  selector: 'app-project-analysis',
  templateUrl: './project-analysis.component.html',
  styleUrls: ['./project-analysis.component.less'],
})
export class ProjectAnalysisComponent implements OnInit {
  isShowSpin: boolean = true;
  projectScheduleInfo: any;
  originProjectScheduleInfo: any;
  projectTableTitle: any[] = [];
  projectTypeName: any[] = [];
  currentStatusOfFilter: any;
  currentStatus: string = 'all';
  projectTypeNameSearchValue: string = ''; // 项目类型筛选条件
  projectSetNameSearchValue: string = '';
  projectLeaderNameSearchValue: string = '';
  projectTypeNameVisible: boolean = false;
  projectSetNameVisible: boolean = false;
  projectLeaderNameVisible: boolean = false;
  projectStatusOfOption = [
    { label: this.translateService.instant('dj-default-未开始'), value: '10' },
    { label: this.translateService.instant('dj-default-进行中'), value: '30' },
    { label: this.translateService.instant('dj-default-已结案'), value: '40' },
    { label: this.translateService.instant('dj-default-暂停'), value: '50' },
    { label: this.translateService.instant('dj-default-指定结案'), value: '60' },
  ];
  projectStatus: string = '30';
  projectAnalysisInfo: any;

  @Output() jumpToProjectInfo = new EventEmitter();

  constructor(
    private translateService: TranslateService,
    private fb: FormBuilder,
    protected changeRef: ChangeDetectorRef,
    public commonService: CommonService,
    public openWindowService: OpenWindowService,
    private messageService: NzMessageService,
    public progressAnalysisService: ProgressAnalysisService
  ) {}

  ngOnInit(): void {
    this.currentStatusOfFilter = [
      { text: this.translateService.instant('dj-default-全选'), value: 'all', byDefault: true },
      { text: this.translateService.instant('dj-default-准时'), value: 'normal' },
      { text: this.translateService.instant('dj-default-落后'), value: 'backward' },
      { text: this.translateService.instant('dj-default-超前'), value: 'advance' },
    ];
    this.getProjectAnalysisInfo();
  }

  thousandTransfer(num: number): string {
    return (num + '').replace(/(\d{1,3})(?=(\d{3})+(?:$|\.))/g, '$1,');
  }

  goTaskAnalysisDetail(item: Object): void {
    this.progressAnalysisService.taskAnalysisSpin = true;
    this.progressAnalysisService.ganttStatus = false;
    this.progressAnalysisService.searchProjectInfo = item;
    this.progressAnalysisService.isShowProjectAnalysis = false;
    this.progressAnalysisService.getTaskAnalysisInfo();
  }

  projectStatusChange($event: any): void {
    this.isShowSpin = true;
    this.projectStatus = $event;
    this.getProjectAnalysisInfo();
  }

  // 当前状态筛选
  currentStatusFilterFn(list: string[]): void {
    if (list.indexOf('all') > -1) {
      const data = this.originProjectScheduleInfo?.project_schedule_detail;
      this.projectScheduleInfo.project_schedule_detail = data;
      return;
    } else {
      const data = [];
      this.originProjectScheduleInfo?.project_schedule_detail.forEach((item: any): void => {
        if (list.indexOf(item.currentStatusFilter) > -1) {
          data.push(item);
          this.projectScheduleInfo.project_schedule_detail = data;
        }
      });
    }
  }

  // 项目类型筛选
  projectTypeNameSearch(): void {
    this.projectSetNameSearchValue = '';
    this.projectLeaderNameSearchValue = '';
    this.projectTypeNameVisible = false;
    // tslint:disable-next-line: max-line-length
    this.projectScheduleInfo.project_schedule_detail =
      this.originProjectScheduleInfo.project_schedule_detail.filter(
        (item: any): boolean =>
          item.project_type_name.indexOf(this.projectTypeNameSearchValue) !== -1
      );
  }

  // 项目集筛选
  projectSetNameSearch(): void {
    this.projectTypeNameSearchValue = '';
    this.projectLeaderNameSearchValue = '';
    this.projectSetNameVisible = false;
    this.projectScheduleInfo.project_schedule_detail =
      this.projectAnalysisInfo.project_schedule_detail.filter(
        (item: any): boolean => item.project_set_name.indexOf(this.projectSetNameSearchValue) !== -1
      );
    this.projectScheduleInfo.project_schedule_detail = this.transformProjectList(
      this.projectScheduleInfo.project_schedule_detail
    );
  }

  // 负责人筛选
  projectLeaderNameSearch(): void {
    this.projectTypeNameSearchValue = '';
    this.projectSetNameSearchValue = '';
    this.projectLeaderNameVisible = false;
    this.projectScheduleInfo.project_schedule_detail =
      this.projectAnalysisInfo.project_schedule_detail.filter(
        (item: any): boolean =>
          item.project_leader_name.indexOf(this.projectLeaderNameSearchValue) !== -1
      );
    this.projectScheduleInfo.project_schedule_detail = this.transformProjectList(
      this.projectScheduleInfo.project_schedule_detail
    );
  }

  reset(): void {
    this.projectTypeNameSearchValue = '';
    this.projectSetNameSearchValue = '';
    this.projectLeaderNameSearchValue = '';
    this.projectSetNameSearch();
    this.projectTypeNameSearch();
    this.projectLeaderNameSearch();
  }

  transformProjectList(list: any): any {
    if (list) {
      this.projectTypeName = [];
      list.forEach((item: any, index: number): void => {
        item.nameNum = 0;
        list.forEach((element: any, inx: any): void => {
          if (item.project_type_name === element.project_type_name) {
            item.nameNum++;
          }
        });
        const nameIndex = this.projectTypeName.indexOf(item.project_type_name);
        if (nameIndex < 0) {
          item.isShow = true;
          this.projectTypeName.push(item.project_type_name);
        } else {
          item.isShow = false;
        }
      });
      return list;
    }
  }

  getProjectAnalysisInfo(): void {
    this.progressAnalysisService.taskAnalysisSpin = true;
    this.progressAnalysisService.ganttStatus = false;
    const params = {
      project_info: [
        {
          project_leader_code: '',
          project_type_no: '',
          project_set_no: '',
          project_status: this.projectStatus || '30',
        },
      ],
    };
    this.commonService
      .getInvData('project.schedule.analysis.info.get', params)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.isShowSpin = false;
          this.projectScheduleInfo = res.data?.project_schedule_info[0];
          this.projectScheduleInfo.advance_project_count = 0;
          this.projectTableTitle = Object.keys(this.projectScheduleInfo.project_schedule_detail[0]);
          if (this.projectScheduleInfo?.project_schedule_detail) {
            this.projectTypeName = [];
            this.projectScheduleInfo?.project_schedule_detail.forEach(
              (item: any, index: number): void => {
                item.currentStatus = multiple(
                  subtract(item.actual_complete_rate, item.plan_complete_rate),
                  100
                );
                if (item.currentStatus === 0) {
                  item.currentStatusFilter = 'normal';
                } else if (item.currentStatus > 0) {
                  item.currentStatusFilter = 'advance';
                  this.projectScheduleInfo.advance_project_count++;
                } else {
                  item.currentStatusFilter = 'backward';
                }
                item.plan_complete_rate = multiple(item.plan_complete_rate.toFixed(4), 100);
                item.overdue_rate = multiple(item.overdue_rate.toFixed(4), 100);
                // tslint:disable-next-line: max-line-length
                item.actual_complete_task_count = this.thousandTransfer(
                  item.actual_complete_task_count
                );
                // tslint:disable-next-line: max-line-length
                item.plan_complete_task_count = this.thousandTransfer(
                  item.plan_complete_task_count
                );
                item.totoal_plan_task_count = this.thousandTransfer(item.totoal_plan_task_count);
                item.remaining_work_hours = this.thousandTransfer(item.remaining_work_hours);
              }
            );
          }
          this.projectAnalysisInfo = cloneDeep(this.projectScheduleInfo);
          // if (this.projectScheduleInfo?.project_schedule_detail) {
          //   this.projectTypeName = [];
          //   this.projectScheduleInfo?.project_schedule_detail.forEach(
          //     (item: any, index: number): void => {
          //       item.nameNum = 0;
          //       this.projectScheduleInfo?.project_schedule_detail.forEach(
          //         (element: any, inx: any): void => {
          //           if (item.project_type_name === element.project_type_name) {
          //             item.nameNum++;
          //           }
          //         }
          //       );
          //       const nameIndex = this.projectTypeName.indexOf(item.project_type_name);
          //       if (nameIndex < 0) {
          //         item.isShow = true;
          //         this.projectTypeName.push(item.project_type_name);
          //       } else {
          //         item.isShow = false;
          //       }
          //       item.currentStatus = multiple(
          //         subtract(item.actual_complete_rate, item.plan_complete_rate),
          //         100
          //       );
          //       if (item.currentStatus === 0) {
          //         item.currentStatusFilter = 'normal';
          //       } else if (item.currentStatus > 0) {
          //         item.currentStatusFilter = 'advance';
          //         this.projectScheduleInfo.advance_project_count++;
          //       } else {
          //         item.currentStatusFilter = 'backward';
          //       }
          //       item.plan_complete_rate = multiple(item.plan_complete_rate.toFixed(4), 100);
          //       item.overdue_rate = multiple(item.overdue_rate.toFixed(4), 100);
          //       // tslint:disable-next-line: max-line-length
          //       item.actual_complete_task_count = this.thousandTransfer(
          //         item.actual_complete_task_count
          //       );
          //       // tslint:disable-next-line: max-line-length
          //       item.plan_complete_task_count = this.thousandTransfer(
          //         item.plan_complete_task_count
          //       );
          //       item.totoal_plan_task_count = this.thousandTransfer(item.totoal_plan_task_count);
          //       item.remaining_work_hours = this.thousandTransfer(item.remaining_work_hours);
          //     }
          //   );
          // }
          if (this.projectScheduleInfo?.project_schedule_detail) {
            this.projectScheduleInfo.project_schedule_detail = this.transformProjectList(
              this.projectScheduleInfo?.project_schedule_detail
            );
          }
          this.projectScheduleInfo.plan_project_count = this.thousandTransfer(
            this.projectScheduleInfo.plan_project_count
          );
          this.projectScheduleInfo.on_schedule_project_count = this.thousandTransfer(
            this.projectScheduleInfo.on_schedule_project_count
          );
          this.projectScheduleInfo.overdue_project_count = this.thousandTransfer(
            this.projectScheduleInfo.overdue_project_count
          );
          this.projectScheduleInfo.advance_project_count = this.thousandTransfer(
            this.projectScheduleInfo.advance_project_count
          );
          this.projectScheduleInfo.total_remaining_work_hours = this.thousandTransfer(
            this.projectScheduleInfo.total_remaining_work_hours
          );
          this.originProjectScheduleInfo = cloneDeep(this.projectScheduleInfo);
          this.projectScheduleInfo.project_schedule_detail = this.reSortProjectList(
            this.projectScheduleInfo.project_schedule_detail
          );
          // tslint:disable-next-line: max-line-length
          this.progressAnalysisService.searchProjectInfo =
            this.originProjectScheduleInfo?.project_schedule_detail[0];
          this.progressAnalysisService.getTaskAnalysisInfo();
          this.changeRef.markForCheck();
        }
      });
  }

  // 将项目类型相同的项目放在一起,重新排序
  reSortProjectList(list: Array<any>): Array<any> {
    const tempList = [];
    this.projectTypeName.forEach((name: string): void => {
      list.forEach((item: any, index: number): void => {
        if (item.project_type_name === name) {
          tempList.push(item);
        }
      });
    });
    return tempList;
  }

  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }
}
