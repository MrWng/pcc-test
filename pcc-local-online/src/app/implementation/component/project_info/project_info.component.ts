import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  cloneDeep,
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicUserBehaviorCommService,
  PluginLanguageStoreService,
  reportedUserBehavior,
  UserBehaviorOperation,
} from '@athena/dynamic-core';
import { DynamicPccProjectInfoModel } from 'app/implementation/model/pcc_project_info/pcc_project_info.model';
import { ProjectInfoService } from './project_info.service';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { AcModalService } from '@app-custom/ui/modal';
import { DynamicWbsService } from '../wbs/wbs.service';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService, OpenWindowService } from '@athena/dynamic-ui';
import { DwUserService } from '@webdpt/framework/user';
// eslint-disable-next-line max-len
import { ProjectChangeTaskWaittingService } from 'app/implementation/programs/task-detail/project-change-task-waitting/project-change-task-waitting.service';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';

@Component({
  selector: 'app-pcc-project-info',
  templateUrl: './project_info.component.html',
  styleUrls: ['./project_info.component.less'],
  providers: [
    ProjectChangeTaskWaittingService,
    ProjectInfoService,
    DynamicWbsService,
    WbsTabsService,
    AddSubProjectCardService,
    CommonService,
    AcModalService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectInfoComponent extends DynamicFormControlComponent implements OnInit, OnDestroy {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicPccProjectInfoModel;
  @Input() source = '';
  @Input() sourceRealy = '';
  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();

  Entry = Entry;
  tabIndex: number = 0;
  changeConfigData = null;
  tabName: string = '';
  isVisible: boolean = false;
  project_info: any;
  selectedIndex = 0;
  activeIndex = 0;
  tabs = [
    {
      title: this.translateService.instant('dj-pcc-计划信息'),
      nzSelect: this.select.bind(this, 0),
    },
    {
      title: this.translateService.instant('dj-pcc-项目基础信息'),
      nzSelect: this.select.bind(this, 1),
    },
  ];
  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public wbsTabsService: WbsTabsService,
    public commonService: CommonService,
    public openWindowService: OpenWindowService,
    private translateService: TranslateService,
    private userService: DwUserService,
    public fb: FormBuilder,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
    private pluginLanguageStoreService: PluginLanguageStoreService,
    public wbsService: DynamicWbsService,
    protected messageService: NzMessageService,
    private projectChangeTaskService: ProjectChangeTaskWaittingService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
    this.projectChangeTaskService.isShowStart = true;
  }

  ngOnDestroy(): void {
    this.projectChangeTaskService.potentialStatus = 0;
  }
  // 计划维护
  async ngOnInit() {
    this.commonService.content = cloneDeep(this.model?.content);
    const project_no =
      this.group.value?.project_info[0]?.project_no ??
      this.model.content?.executeContext?.bpmData?.project_info[0]?.project_no;
    this.wbsService.project_no = project_no ?? '';
    // this.initData();
    this.changeRef.markForCheck();
  }

  /**
   * 页面，获取项目信息
   */
  initData() {
    this.commonService
      .getInvData('bm.pisc.project.get', {
        project_info: [{ project_no: this.wbsService.project_no }],
      })
      .subscribe((res) => {
        this.wbsService.editable = false;
        this.wbsService.needFullScreen = false;
        this.wbsService.projectInfo = res.data.project_info[0];
        this.project_info = res.data.project_info[0];
        this.isVisible = true;
        this.selectedIndex = 0;
        this.tabIndex = 0;
        this.changeRef.markForCheck();
      });
  }

  changTabIndex(): void {
    this.tabIndex = 1;
  }

  successTransfer($event: any): void {
    this.projectChangeTaskService.potentialStatus = $event;
    this.wbsService.projectInfo.to_be_formal_project = true;
  }

  changeConfig($event: any): void {
    this.changeConfigData = $event;
  }

  tabClickHandle(type) {
    if (type && this.wbsService.project_no && this.source === Entry.projectChange) {
      switch (type) {
        case 'app-dynamic-wbs': {
          this.tabName = 'app-dynamic-wbs';
          this.projectChangeTaskService.changeDataOriginByTabIndex();
          break;
        }
        case 'app-project-creation': {
          // 【项⽬基础信息维护】页面栏位管控
          this.tabName = 'app-project-creation';
          this.projectChangeTaskService.changeDataOriginByTabIndex(1);
          break;
        }
        default: {
          this.tabName = '';
          this.projectChangeTaskService.changeDataOriginByTabIndex();
          break;
        }
      }
    }
  }

  showTable() {
    this.initData();
  }
  handleCancel() {
    this.isVisible = false;
    this.changeRef.markForCheck();
  }
  select(e: any) {
    e === '0'
      ? this.tabClickHandle('app-dynamic-wbs')
      : this.tabClickHandle('app-project-creation');
    this.tabIndex = e;
    const tabMenu = new Map([
      [0, 'dj-default-计划维护'],
      [1, 'dj-pcc-专案基础信息维护'],
    ]);
    const tabCode = new Map([
      [0, '-PCC_TAB001-PCC_BUTTON000'],
      [1, '-PCC_TAB002-PCC_BUTTON000'],
    ]);
    const behaviorCommData = this.userBehaviorCommService.generateBehaviorCommData({
      operation: UserBehaviorOperation.OPEN_TAB,
      attachData: {
        name: this.pluginLanguageStoreService.getAllI18n(tabMenu.get(this.tabIndex)),
        appCode: 'PCC',
        code: 'PCC-' + this.userBehaviorCommService.commData.workType + tabCode.get(this.tabIndex),
      },
    });
    reportedUserBehavior(behaviorCommData);
    this.changeRef.markForCheck();
  }
}
