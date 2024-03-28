import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicCooperationTaskModel } from '../../../model/cooperation-task/cooperation-task.model';
import { CommonService, Entry } from '../../../service/common.service';
import { OnDestroy } from '@angular/core';
import { DynamicWbsService } from '../../../component/wbs/wbs.service';
import { AddSubProjectCardService } from 'app/implementation/component/add-subproject-card/add-subproject-card.service';
import { DynamicTaskWbsListComponent } from './components/task-wbs-list/task-wbs-list.component';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { ApprovalProgressComponent } from 'app/implementation/component/wbs/components/task-detail/components/approval-progress/approval-progress.component';
import { WbsTabsService } from 'app/implementation/component/wbs-tabs/wbs-tabs.service';

@Component({
  selector: 'app-cooperation-task',
  templateUrl: './cooperation-task.component.html',
  styleUrls: ['./cooperation-task.component.less'],
  providers: [DynamicWbsService, WbsTabsService, AddSubProjectCardService, CommonService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// tslint:disable-next-line
export class CooperationTaskComponent
  extends DynamicFormControlComponent
  implements OnInit, OnDestroy
{
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicCooperationTaskModel;

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();

  @ViewChild(DynamicTaskWbsListComponent)
  private dynamicTaskWbsListComponent!: DynamicTaskWbsListComponent;

  // wbs入口
  Entry = Entry;

  tabIndex: number = 0;
  datas: Array<any>;
  taskTipInfo = this.translateService.instant(
    'dj-pcc-存在一级任务的任务比重 < 100%，则所有一级任务的任务比重累计必须等于100%！'
  );

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public wbsService: DynamicWbsService,
    public commonService: CommonService,
    private modalService: AthModalService,
    private translateService: TranslateService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  get isApproveStatus() {
    return this.wbsService.projectInfo?.approve_status === 'N';
  }

  ngOnInit(): void {
    this.commonService.content = this.model.content;
    const bpmData = this.model?.content?.executeContext?.taskWithBacklogData?.bpmData;
    this.wbsService.project_no = bpmData?.assist_schedule_info
      ? bpmData?.assist_schedule_info[0]?.project_no
      : bpmData?.task_info[0]?.project_no;
    // 任务比重校验
    this.changeWbsTaskProportion();
    this.monitorTaskProportionChange();
  }

  monitorTaskProportionChange(): void {
    this.wbsService.$checkProportion.subscribe((res) => {
      this.changeWbsTaskProportion();
    });
  }

  changeIndex($event: any): void {
    // 计划协同排定，页面中的tab页下标
    this.tabIndex = $event;
  }

  // 协同，页面初始化，增删改任务卡
  changeWbsTaskProportion() {
    this.commonService.content = this.model.content;
    const bpmData = this.model?.content?.executeContext?.taskWithBacklogData?.bpmData;
    const taskInfo = bpmData?.assist_schedule_info
      ? bpmData?.assist_schedule_info[0]
      : bpmData?.task_info[0];
    this.commonService
      .getTaskProportionInfo('collaborate', taskInfo?.project_no, taskInfo)
      .subscribe((res: any): void => {
        if (res.data && res.data?.project_info) {
          const project_info = res.data?.project_info.filter(
            (item) => item.project_no === taskInfo?.project_no
          );
          const task_no = [];
          project_info.forEach((item) => {
            if (item.upper_level_task_no) {
              task_no.push(item.upper_level_task_no);
            }
          });
          this.wbsService.taskProportionCheck = {
            project_info,
            task_no: task_no,
            taskInfoTip: !!task_no.length,
            projectInfoTip: task_no.length < project_info.length && project_info.length,
            tip: !!task_no.length || !!project_info.length,
          };
        }
        this.changeRef.markForCheck();
        this.dynamicTaskWbsListComponent.markForCheck();
      });
  }

  changeType(type) {
    this.wbsService.changeType(type);
    this.changeRef.markForCheck();
    this.dynamicTaskWbsListComponent.markForCheck();
  }

  lookSignOffProgress(): void {
    this.modalService.create({
      nzTitle: null,
      nzFooter: null,
      nzContent: ApprovalProgressComponent,
      nzOkText: null,
      nzCancelText: null,
      nzComponentParams: {
        taskOrProjectId: this.wbsService.projectInfo.projectId,
        idType: 'project',
        project_no: this.wbsService.project_no,
        wbsService: this.wbsService,
      },
      nzWidth: 550,
      nzClassName: 'signOffProgress-modal-center-sty',
      nzNoAnimation: true,
      nzClosable: true,
      nzOnOk: (): void => {},
    });
  }
}
