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
  cloneDeep,
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
  // loading蒙层组件
  @ViewChild('loadingModal') loadingModal: any;
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
  datas: any;
  taskTipInfo = this.translateService.instant(
    'dj-pcc-存在一级任务的任务比重 < 100%，则所有一级任务的任务比重累计必须等于100%！'
  );
  isDisabled: boolean = true;
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
    // U.未送签；Y.已完成；N.签核中；M.签核退回；V.无需签核
    return this.wbsService.projectInfo?.approve_status === 'N';
  }

  ngOnInit(): void {
    this.commonService.content = this.model.content;
    const bpmData = this.model?.content?.executeContext?.taskWithBacklogData?.bpmData;
    this.datas = bpmData?.assist_schedule_info
      ? bpmData?.assist_schedule_info[0]
      : bpmData?.task_info[0];
    const datas = cloneDeep(this.datas);
    this.wbsService.project_no = datas?.project_no;
    // 任务比重校验
    this.changeWbsTaskProportion();
    this.monitorTaskProportionChange();
    if (datas && datas.project_no && datas.task_no) {
      datas['schedule_status'] = '1';
      if (!datas.assist_schedule_seq) {
        datas['assist_schedule_seq'] = datas.teamwork_plan_seq;
        Reflect.deleteProperty(datas, 'teamwork_plan_seq');
      }
      this.commonService
        .getInvData('bm.pisc.assist.schedule.get', {
          assist_schedule_info: [datas],
        })
        .subscribe((res) => {
          this.isDisabled = !res?.data?.assist_schedule_info?.length;
          this.changeRef.markForCheck();
        });
    }
  }

  monitorTaskProportionChange(): void {
    this.wbsService.$checkProportion.subscribe((res) => {
      this.changeWbsTaskProportion();
    });
  }

  changeIndex($event: any): void {
    // 计划协同排定，页面中的tab页下标
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

  cancelCollaborationSuccess() {
    this.refreshPage();
  }
  cancelCollaborationFullFail() {
    this.refreshPage();
  }
  tipContent() {
    if (this.wbsService.typeChange === 'card') {
      return this.wbsService.generationWbsTip();
    }
  }
  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
  // 刷新页面
  refreshPage() {
    setTimeout(() => {
      try {
        this.change.emit({
          type: 'application-submit',
          isDrawClose: true,
        });
      } catch (error) {}
    }, 300);
  }
}
