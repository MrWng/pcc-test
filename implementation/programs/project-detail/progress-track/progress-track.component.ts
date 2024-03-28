import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicUserBehaviorCommService,
} from '@ng-dynamic-forms/core';
import { DwUserService } from '@webdpt/framework/user';
import { CommonService, Entry } from '../../../service/common.service';
import { DynamicWbsService } from '../../../component/wbs/wbs.service';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { DynamicProgressTrackModel } from '../../../model/progress-track/progress-track.model';
import { AddSubProjectCardService } from 'app/customization/task-project-center-console/component/add-subproject-card/add-subproject-card.service';
import { PosumService } from 'app/customization/task-project-center-console/component/add-subproject-card/services/posum.service';
import { WbsTabsService } from 'app/customization/task-project-center-console/component/wbs-tabs/wbs-tabs.service';

@Component({
  selector: 'app-progress-track',
  templateUrl: './progress-track.component.html',
  styleUrls: ['./progress-track.component.less'],
  providers: [DynamicWbsService, WbsTabsService, CommonService, AddSubProjectCardService, PosumService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// tslint:disable-next-line
export class ProgressTrackComponent extends DynamicFormControlComponent implements OnInit, OnDestroy {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicProgressTrackModel;

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();

  // wbs入口
  Entry = Entry
  // 项目卡信息
  project_info: any = {};

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public commonService: CommonService,
    private userService: DwUserService,
    public wbsService: DynamicWbsService,
    public dynamicUserBehaviorCommService: DynamicUserBehaviorCommService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit(): void {
    this.wbsService.isTrackPages = true;
    this.wbsService.group = this.group;
    this.wbsService.modelType = this.model.type;
    this.commonService.content = this.model?.content;
    this.wbsService.project_no = this.model.content?.executeContext?.taskWithBacklogData?.bpmData?.project_data[0]?.project_no ?? '';
    this.initData();
    this.wbsService.initWbsShow.subscribe((res) => {
      this.initData();
    });
  }

  /**
   * 进度追踪页面，获取项目信息
   */
  initData() {
    this.commonService.getInvData('bm.pisc.project.get', { project_info: [{ project_no: this.wbsService.project_no }] })
      .subscribe((res) => {
        this.wbsService.projectInfo = res.data.project_info[0];
        this.project_info = res.data.project_info[0];
        this.changeRef.markForCheck();
        this.isEditable();
      });
  }

  /**
   * 判断任务卡是否可编辑
   * @param leader_code
   */
  isEditable(): void {
    if (this.wbsService.projectInfo?.approve_status === 'N') {
      this.wbsService.editable = false;
      this.changeRef.markForCheck();
      return;
    }
    const personInCharge = this.dynamicUserBehaviorCommService.commData?.workContent?.personInCharge ?? 'wfgp001';
    forkJoin([
      this.commonService.searchUserInfo({ userId: this.userService.getUser('userId') }),
      this.commonService.getAgentInfo({ userId: personInCharge })
    ])
      .pipe(map((responses): any => responses.map((item): any => item.data)))
      .subscribe(
        (value) => {
          if (value[0].id === value[1].agentId) {
            this.wbsService.editable = true;
            this.changeRef.markForCheck();
            return;
          };
          const isHistory = this.wbsService.projectInfo?.project_status !== '40' && this.wbsService.projectInfo?.project_status !== '60'
            ? false : true;
          const hasPermission = value[0].id === this.wbsService.projectInfo?.project_leader_code ? true : false;
          this.wbsService.editable = hasPermission && !isHistory;
          this.changeRef.markForCheck();
        });
  }





  ngOnDestroy(): void { }

}
