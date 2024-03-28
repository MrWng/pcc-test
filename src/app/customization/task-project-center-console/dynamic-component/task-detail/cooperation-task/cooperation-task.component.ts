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
} from '@ng-dynamic-forms/core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicCooperationTaskModel } from '../../../model/cooperation-task/cooperation-task.model';
import { CommonService, Entry } from '../../../service/common.service';
import { OnDestroy } from '@angular/core';
import { DynamicWbsService } from '../../../component/wbs/wbs.service';
import { AddSubProjectCardService } from 'app/customization/task-project-center-console/component/add-subproject-card/add-subproject-card.service';
import { DynamicTaskWbsListComponent } from './components/task-wbs-list/task-wbs-list.component';
import { AthModalService } from 'ngx-ui-athena/src/components/modal';
import { ApprovalProgressComponent } from 'app/customization/task-project-center-console/component/wbs/components/task-detail/components/approval-progress/approval-progress.component';
import { WbsTabsService } from 'app/customization/task-project-center-console/component/wbs-tabs/wbs-tabs.service';


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
  implements OnInit, OnDestroy {
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
  Entry = Entry

  tabIndex: number = 0;
  datas: Array<any>;

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public wbsService: DynamicWbsService,
    public commonService: CommonService,
    private modalService: AthModalService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  get isApproveStatus() {
    return this.wbsService.projectInfo.approve_status === 'N';
  }

  ngOnInit(): void {
    this.commonService.content = this.model.content;
    // spring 3.2 更换api名称 [入参、出参]：'teamwork.task.plan.info.get' ==> 'bm.pisc.assist.schedule.get'
    // 配合标准前端修改
    const bpmData = this.model?.content?.executeContext?.taskWithBacklogData?.bpmData;
    this.wbsService.project_no = bpmData?.assist_schedule_info
      ? bpmData?.assist_schedule_info[0]?.project_no : bpmData?.task_info[0]?.project_no;
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

  changeWbsTaskProportion() {
    this.commonService.getInvData(
      'task.proportion.check',
      { project_info: [{ project_no: this.wbsService.project_no }], check_all_task: '2' }
    ).subscribe((res: any): void => {
      const { project_info, task_info } = res.data ?? {};
      this.wbsService.taskProportionCheck = {
        project_info,
        task_info,
        taskInfoTip: !!task_info.length,
        projectInfoTip: !!project_info.length,
        tip: !!task_info.length || !!project_info.length
      };
      this.changeRef.markForCheck();
      this.dynamicTaskWbsListComponent.markForCheck();
    });
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
      },
      nzWidth: 550,
      nzClassName: 'signOffProgress-modal-center-sty',
      nzNoAnimation: true,
      nzClosable: true,
      nzOnOk: (): void => { },
    });
  }
}
