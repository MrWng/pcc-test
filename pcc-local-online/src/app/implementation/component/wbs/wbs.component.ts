import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  cloneDeep,
  DynamicFormControlComponent,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicUserBehaviorCommService,
  multiple,
  PluginLanguageStoreService,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { DynamicWbsService } from './wbs.service';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { CommonService, Entry } from '../../service/common.service';
import { DragDropService } from '../../directive/dragdrop/dragdrop.service';
import {
  animationFrameScheduler,
  BehaviorSubject,
  forkJoin,
  fromEvent,
  Observable,
  Subject,
  Subscription,
} from 'rxjs';
import { debounceTime, filter, map, pairwise, pluck, takeUntil, tap } from 'rxjs/operators';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';
import { OpenWindowService } from '@athena/dynamic-ui';
import { DwUserService } from '@webdpt/framework/user';
import { diff } from 'deep-diff';
import { DynamicGanttComponent } from '../gantt/gantt.component';
import { CriticalPath, DependencyInfoList, TaskInfo } from './wbs.interface';
import { ButtonType } from '../add-subproject-card/add-subproject-card.interface';
import { ProjectPlanCardComponent } from '../project-plan-card/project-plan-card.component';
import { WbsHeaderComponent } from './components/wbs-header/wbs-header.component';
import { ModalFormService } from '@app-custom/ui/modal-form';
import { CdkDragDrop, moveItemInArray, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { PccResizeService } from 'app/implementation/service/resize.service';
@Component({
  selector: 'app-dynamic-wbs',
  templateUrl: './wbs.component.html',
  styleUrls: ['./wbs.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ModalFormService],
})
export class DynamicWbsComponent
  extends DynamicFormControlComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  @Input() source: Entry = Entry.card;
  // 动态赋值，从最上层的父组件入值
  @Input() sourceRealy = '';
  @ViewChild('dynamicGantt') ganttComponent: DynamicGanttComponent;
  @ViewChild('projectPlanCard') projectPlanCard: ProjectPlanCardComponent;
  @ViewChild('wbsHeader') wbsHeader: WbsHeaderComponent;
  @ViewChild('wbsBox') wbsBox: ElementRef;
  @ViewChild('wbsWrapper') wbsWrapper: ElementRef;
  // 项目模版维护数据
  @Input() projectTemplateMaintainData: any = [];
  @Input() changeConfigData: any;
  @Input() tabName: String;
  @Input() hasAuth: boolean = true;

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();
  @Output() refreshPageChange: EventEmitter<any> = new EventEmitter();
  @Output() changeLoading: EventEmitter<any> = new EventEmitter();

  @Input() signOff: boolean = false;

  public destroy$ = new Subject<void>();
  startTipInfo = this.translateService.instant(
    'dj-default-请维护项目类型，项目类型为空，不可进行计划维护/启动项目！'
  );
  taskTipInfo = this.translateService.instant(
    'dj-pcc-存在一级任务的任务比重 < 100%，则所有一级任务的任务比重累计必须等于100%！'
  );
  addFirstPlanStartDrag: boolean = false;
  // wbs入口
  Entry = Entry;
  // 项目信息
  projectInfo: any;
  ganttAndPertData: Array<any>;
  // 甘特图时矩：day、week、month
  scales: string = 'day';
  // 关键路径
  criticalPath: CriticalPath[];
  dependencyInfo: DependencyInfoList[];
  // 甬道内的所有子卡，方便把嵌套结构转化为平铺计算一级卡片的状态
  corridorChildrens: Array<any>;

  datasLength: number = 0;
  // 控制一级计划新增
  // firstPlanSwitch: boolean = false;
  newTaskSubscribed: Subscription;
  useTaskTemplateSubscribed: Subscription;
  // 计划开始日期之前禁用
  disabledDate: any;
  // 不可拖拽得树父级id
  parentIdList: any = [];
  // 获取修改项目编号带入值需要变更的数据列表
  editTaskData = [];
  projectPlanningProcessType: string = '-1';
  // true 禁用 false 可用
  accessibleStatus: boolean = false;
  hasGroundEnd: any; // 交付设计器，是否依赖地端
  hasT100: boolean = false;
  // 标记时间分片的数量
  private loopCount = 0;
  addSubItemCode: string;
  addFirstItemCode: any;

  taskChildrenNos: any = [];
  // 【已读】按钮操作
  unRead: boolean = false;
  initData: any = [];
  callReadFn$ = new Subject<void>();
  myOb = new BehaviorSubject(null);
  // 存储可拖拽的索引
  dragDisabledIndex = new Set();

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public wbsService: DynamicWbsService,
    private translateService: TranslateService,
    public addSubProjectCardService: AddSubProjectCardService,
    public commonService: CommonService,
    protected dragDropService: DragDropService,
    public wbsTabsService: WbsTabsService,
    public openWindowService: OpenWindowService,
    public fb: FormBuilder,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
    private pluginLanguageStoreService: PluginLanguageStoreService,
    private userService: DwUserService,
    public zone: NgZone,
    private pccResizeService: PccResizeService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
    this.addSubItemCode =
      'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON005';
    this.addFirstItemCode =
      'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON001';
  }

  // 签核状态，标识
  get isApproveStatus() {
    const { approve_status, project_status } = this.wbsService.projectInfo;
    // 项目启动签核，不显示
    return this.source !== Entry.projectChange && approve_status === 'N' && project_status !== '20';
  }

  get getShowAddIcon() {
    return (
      this.wbsService.projectInfo?.project_status !== '10' ||
      this.projectPlanningProcessType !== '2'
    );
  }
  refreshPageChangeFn() {
    this.refreshPageChange.emit();
  }

  changeLoadingFn(status) {
    this.changeLoading.emit(status);
  }

  async ngOnInit(): Promise<void> {
    console.log('wbs-sourceRealy: ', this.sourceRealy);
    if (this.source === Entry.card) {
      this.wbsService.is_sync_document = await this.commonService
        .getSyncDoc()
        .toPromise()
        .then((res) => res.data.syncDoc);
    }
    if (this.source === Entry.collaborate) {
      await this.addSubProjectCardService.getDateCheck();
    }
    this.removeSessionStorage();
    const { bpmData } = this.commonService.content?.executeContext?.taskWithBacklogData || {};
    this.hasGroundEnd = bpmData?.hasGroundEnd;
    // 1 PM独自完成 2 协同计划 3 混合计划（两者都有）
    // this.projectPlanningProcessType = bpmData?.projectPlanningProcessType || '-1';
    this.getProjectPlanFlow();
    this.getFirstTaskListInfo();
    this.getTenantProductOperationList(); // 获取T100状态
    if (this.control) {
      this.getDatas(this.control.value);
    } else {
      this.source === Entry.card || this.source === Entry.projectChange
        ? this.getTaskInfo()
        : this.getDatas(this.projectTemplateMaintainData);
    }
    /** 获取首屏缓存的数据用于展示 */
    const storageFirstScreenData =
      sessionStorage.getItem(`pcc_wbs_data_project_no_${this.wbsService.project_no}`) || '';
    if (storageFirstScreenData) {
      const firstScreenData = JSON.parse(storageFirstScreenData);
      this.wbsService.pageDatas = firstScreenData;
    }
    this.disabledDate = (endValue: Date): boolean => {
      if (!endValue || !this.wbsService.projectInfo?.plan_start_date) {
        return false;
      }
      return (
        moment(endValue).format('YYYY-MM-DD') <
        moment(this.wbsService.projectInfo?.plan_start_date).format('YYYY-MM-DD')
      );
    };
    if (
      this.source === Entry.card &&
      bpmData &&
      bpmData.project_info &&
      bpmData.project_info[0]['project_no']
    ) {
      this.getProjectChangeStatus(bpmData.project_info[0].project_no);
    }
    this.checkTaskProportion();
    // wbs卡片删除，新建调用修改service数据
    this.monitorAddTaskInfo();
    // 卡片使用模板 重新获取数据 pert图等数据
    this.monitorUpdateTaskCards();
    this.monitorTaskProportionChange();
    this.initReadFn();
    this.initEventHandleSubject();
  }
  ngAfterViewInit(): void {}
  /**
   * 监听相关容器宽高变化
   * 1. wbsBox
   * 2. wbsWrapper
   */
  hideRightSCrollViewMask: boolean = false;
  hideLeftSCrollViewMask: boolean = true;
  scrollWbsBoxWrapper: boolean = false;
  scrollWbsBoxViewDisplay: boolean = false;
  wbsBoxScrollHeight = 0;
  wbsBoxOffsetHeight = 0;
  wbsBoxClientWidth = 0;
  wbsBoxScrollWidth = 0;
  wbsBoxScrollEvent$;
  wbsWrapperResizeEvent$;
  wbsBoxHasVerticalScrollBar: boolean = false;
  wbsBoxHasHorizontalScrollBar: boolean = false;
  wbsWrapperOffsetWidth = 0;
  scrollBarHeight = 8;
  // 监听wbsBox容器滚动事件
  private bindWbsBoxSCrollEvent() {
    if (this.wbsBoxScrollEvent$) {
      return;
    }
    let event;
    this.wbsBoxScrollEvent$ = fromEvent(this.wbsBox.nativeElement, 'scroll', { passive: true })
      .pipe(
        takeUntil(this.destroy$),
        tap((e: any) => (event = e)),
        pluck('target', 'scrollLeft'),
        pairwise(),
        filter(([prev, curr]) => prev !== curr),
        map(() => event)
      )
      .subscribe(this.wbsBoxScrollHandler.bind(this));
  }
  private bindWbsWrapperResizeEvent() {
    if (this.wbsWrapperResizeEvent$) {
      return;
    }
    this.wbsWrapperResizeEvent$ = this.pccResizeService
      .observe(this.wbsWrapper.nativeElement)
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.wbsWrapperResizeHandler.bind(this));
  }
  private wbsWrapperResizeHandler(e) {
    if (this.isCorridorDragging) {
      return;
    }
    animationFrameScheduler.schedule(() => {
      this.wbsWrapperOffsetWidth = this.wbsWrapper.nativeElement.offsetWidth;
      this.wbsBoxOffsetHeight = this.wbsBox.nativeElement.offsetHeight;
      this.wbsBoxClientWidth = this.wbsBox.nativeElement.clientWidth;
      this.wbsBoxScrollWidth = this.wbsBox.nativeElement.scrollWidth;
      const wbsBoxScrollHeight = this.wbsBox.nativeElement.scrollHeight;
      const scrollLeft = this.wbsBox.nativeElement.scrollLeft;
      this.hideLeftSCrollViewMask = scrollLeft === 0;
      this.hideRightSCrollViewMask =
        scrollLeft + this.wbsBoxClientWidth + 24 >= this.wbsBoxScrollWidth;
      this.wbsBoxHasHorizontalScrollBar = this.wbsBoxScrollWidth > this.wbsBoxClientWidth;
      this.wbsBoxHasVerticalScrollBar =
        this.wbsBoxScrollHeight > this.wbsBox.nativeElement.clientHeight;
      // 如果有横向滚动条需要减去滚动条的高度
      this.wbsBoxScrollHeight = !this.wbsBoxHasHorizontalScrollBar
        ? wbsBoxScrollHeight
        : wbsBoxScrollHeight - this.scrollBarHeight;
      this.scrollWbsBoxViewDisplay = this.wbsBoxScrollWidth > this.wbsBoxClientWidth;
      this.changeRef.markForCheck();
    });
  }
  private wbsBoxScrollHandler(e) {
    this.zone.run(() => {
      animationFrameScheduler.schedule(() => {
        this.scrollWbsBoxWrapper = true;
        const scrollLeft = e.target.scrollLeft,
          clientWidth = this.wbsBoxClientWidth,
          scrollWidth = this.wbsBoxScrollWidth;
        this.hideLeftSCrollViewMask = scrollLeft === 0;
        this.hideRightSCrollViewMask = scrollLeft + clientWidth + 24 >= scrollWidth;
        this.changeRef.markForCheck();
      });
    });
  }
  wbsWrapperContentChanged(e) {
    if (this.isCorridorDragging) {
      return;
    }
    this.bindWbsWrapperResizeEvent();
    animationFrameScheduler.schedule(() => {
      this.wbsWrapperOffsetWidth = this.wbsWrapper.nativeElement.offsetWidth;
      this.changeRef.markForCheck();
    });
  }
  wbsBoxContentChanged(e) {
    if (this.isCorridorDragging) {
      return;
    }
    this.bindWbsBoxSCrollEvent();
    animationFrameScheduler.schedule(() => {
      this.wbsBoxOffsetHeight = this.wbsBox.nativeElement.offsetHeight;
      this.wbsBoxClientWidth = this.wbsBox.nativeElement.clientWidth;
      this.wbsBoxScrollWidth = this.wbsBox.nativeElement.scrollWidth;
      this.hideRightSCrollViewMask = this.wbsBoxScrollWidth <= this.wbsBoxClientWidth;
      const wbsBoxScrollHeight = this.wbsBox.nativeElement.scrollHeight;
      this.wbsBoxHasHorizontalScrollBar = this.wbsBoxScrollWidth > this.wbsBoxClientWidth;
      // 如果有横向滚动条需要减去滚动条的高度
      this.wbsBoxScrollHeight = !this.wbsBoxHasHorizontalScrollBar
        ? wbsBoxScrollHeight
        : wbsBoxScrollHeight - this.scrollBarHeight;
      this.wbsBoxHasVerticalScrollBar =
        this.wbsBoxScrollHeight > this.wbsBox.nativeElement.clientHeight;
      this.scrollWbsBoxViewDisplay = this.wbsBoxScrollWidth > this.wbsBoxClientWidth;
      this.changeRef.markForCheck();
    });
  }
  initEventHandleSubject() {
    this.wbsService.$projectChangeStatusSubscribe.subscribe((res: any) => {
      if (res && res.type) {
        this.wbsService.projectChangeStatus[res.type] = res[res.type];
        this.changeRef.markForCheck();
      }
    });
  }

  /**
   * 获取项⽬变更状态
   */
  getProjectChangeStatus(project_no) {
    // 【进度追踪】⻚签头部信息，增加显⽰信息：项⽬变更中； [暂停项⽬]； [指定结案]；[结案]; ==> false，存在【项目变更中】
    this.commonService.getProjectChangeStatus(project_no, ['1'], '2').subscribe(
      (res: any): void => {
        // 若回参.存在否=true，显示 项目变更中
        this.wbsService.projectChangeStatus['check_type_init'] =
          res.data?.project_info[0]?.check_result;
        this.changeRef.markForCheck();
      },
      (error) => {
        this.wbsService.projectChangeStatus['check_type_init'] = true;
        this.changeRef.markForCheck();
      }
    );
  }

  getTaskChildrenNos(data): any[] {
    if (
      data.isCollaborationCard &&
      (this.source === Entry.card || this.source === Entry.projectChange)
    ) {
      return this.wbsService.getAllGroupTaskNo(data.task_no);
    } else {
      return [];
    }
  }

  // 添加子项 的控制条件
  addChildConditionAggregation(data): boolean {
    if (this.getTaskChildrenNos(data).length) {
      return false;
    } else {
      return (
        (this.wbsService.projectInfo?.project_status !== '10' ||
          this.projectPlanningProcessType !== '2') &&
        !(this.getTaskProportionCheck() || this.hasTaskProportionCheck(data))
      );
    }
  }

  monitorUpdateTaskCards(): void {
    this.wbsService.pageChange.subscribe((res) => {
      console.log('入口：' + this.sourceRealy, '，重新获取页面数据：', res);
      this.getTaskInfo();
    });
  }

  monitorTaskProportionChange(): void {
    this.wbsService.$checkProportion.subscribe((res) => {
      if (res) {
        this.checkTaskProportion();
      } else {
        // 清除页面上的任务比重提示信息
        this.wbsService.taskProportionCheck = {
          project_info: [],
          task_no: [],
          taskInfoTip: false,
          projectInfoTip: false,
          tip: false,
        };
        this.changeRef.markForCheck();
      }
    });
  }

  // 项目计划流程
  getProjectPlanFlow() {
    this.commonService
      .getMechanismParameters('projectPlanFlow')
      .toPromise()
      .then((res) => {
        // 1: PM独自完成项目计划(不需协同计划)
        // 2: 协同计划(一定需要协同计划)
        // 3: 混合计划(两种同时存在)
        this.projectPlanningProcessType = res.data?.projectPlanFlow
          ? res.data?.projectPlanFlow
          : '-1';
        this.changeRef.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.removeSessionStorage();
    this.removeListeners();
    this.wbsService.showGantt = false;
  }

  private removeListeners(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private removeSessionStorage(): void {
    sessionStorage.removeItem('hasEditFromTaskNoArr' + this.wbsService.project_no);
    sessionStorage.removeItem('TaskNoFrom' + this.wbsService.project_no);
  }

  /**
   * 获取任务卡信息
   */
  getTaskInfo(): void {
    forkJoin([
      this.commonService.getTaskInfo(
        this.wbsService.project_no,
        this.source,
        this.wbsService.change_version
      ),
      this.commonService.getCollaborationCard(this.wbsService.project_no),
    ])
      .pipe(
        map((responses): any => responses.map((item): any => item.data)),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        let project_info = value[0].project_info ?? []; // 页面信息，所有任务卡
        if (this.source === Entry.projectChange) {
          value[0].project_change_task_detail_info?.forEach((task: any): void => {
            task.task_status = task.old_task_status; // 原任务状态
            task.liable_person_code = task.responsible_person_no; // 负责人角色编号
            task.liable_person_name = task.responsible_person_name; // 负责人角色名称
            task.liable_person_department_code = task.responsibility_department_no; // 负责人部门编号
            task.liable_person_department_name = task.responsibility_department_name; // 负责人部门名称
            task.task_template_no = task.task_template_parameter_no; // 任务模板类型编号
            task.task_template_name = task.task_template_parameter_name; // 任务模板类型编号
            task.type_field_code = task.user_defined01; // 类型栏位代号
            task.type_condition_value = task.user_defined01_value; // 类型条件值
            task.sub_type_field_code = task.user_defined02; // 次类型栏位代号
            task.sub_type_condition_value = task.user_defined02_value; // 次类型条件值
            task.outsourcing_field_code = task.user_defined03; // 托外栏位代号
            task.outsourcing_condition_value = task.user_defined03_value; // 托外条件值
            task.seq = task.doc_seq; // 单据序號
            task.task_dependency_info = task.project_change_task_dep_info; // 任务依赖关系信息
            task.task_member_info = task.project_change_task_member_info; // 任务执行人信息
          });
          project_info = value[0].project_change_task_detail_info ?? [];
        }
        this.wbsService.allTaskCardList = project_info;
        this.getDatas(project_info);
        if (this.source !== Entry.maintain) {
          this.getFirstTaskListInfo();
          // spring 3.2 更换api名称 [入参、出参]：'teamwork.task.plan.info.get' ==> 'bm.pisc.assist.schedule.get'
          const task_info = value[1].assist_schedule_info ?? [];
          const task_info_list = task_info.map((infoItem) => infoItem.task_no);
          this.wbsService.pageDatas.forEach((dataItem) => {
            if (task_info_list.includes(dataItem.task_no)) {
              this.wbsService.hasCollaborationCard = true;
              dataItem.noEdit = true;
              dataItem.isCollaborationCard = true;
            }
          });
        }
        this.changeRef.markForCheck();
      });
  }

  getDatas(data: any): void {
    this.loopCount = 0;
    this.initData = JSON.parse(JSON.stringify(data));
    const transFormDatas = this.transformData(this.initData);
    this.wbsService.pageDatas = transFormDatas;
    this.unRead =
      ['card', 'progressTrack'].includes(this.sourceRealy) &&
      !!this.initData?.filter((item) => item.update_flag === true).length;
    if (this.wbsService?.isTrackPages && this.wbsService.pageDatas?.length) {
      const params = { project_info: [{ project_no: this.wbsService.project_no }] };
      this.commonService
        .getInvData('bm.pisc.task.deliverables.uploaded.flag.process', params)
        .subscribe((res) => {
          // API-198回参不为空，则依据回参.任务编号打标记，若回参.交付物是否已上传=1
          // 1.需要交付物,则显示需交付物的图标标记；若回参.交付物是否已上传=2
          // 2.需要交付物且交付物已上传,则显示已有交付物的图标标记
          if (res?.data?.task_info && res.data.task_info?.length) {
            res.data.task_info.forEach((value) => {
              this.finderForAttachmentStatus(this.wbsService.pageDatas, value);
              this.changeRef.markForCheck();
            });
          }
          // !处理组件传值异步赋值子组件拿不到值问题
          this.myOb.next(this.wbsService.pageDatas);
        });
    }
    // this.loopTask(transFormDatas);
    this.ganttAndPertData = this.getAllDatas(JSON.parse(JSON.stringify(transFormDatas)));
    this.datasLength = data.length;
  }

  // 需要交付物/交付物已上传，找到对应任务卡，增加标记
  finderForAttachmentStatus(list: any[], value: any) {
    for (let i = 0; i < list.length; i++) {
      const task = list[i];
      if (task.task_no === value.task_no) {
        task['attachment_status'] = value.attachment_status;
        break;
      }
      if (task.children?.length) {
        this.finderForAttachmentStatus(task.children, value);
      }
    }
  }

  /**
   * 后端接口未分页，前端使用时间分片渲染
   * @param data
   * @returns
   */
  loopTask(transFormDatas: any): void {
    if (this.loopCount > transFormDatas.length) {
      return;
    }
    this.updateDatas(transFormDatas);
    !!requestAnimationFrame
      ? requestAnimationFrame(() => {
          this.loopTask(transFormDatas);
        })
      : setTimeout(() => {
          this.loopTask(transFormDatas);
        });
  }

  updateDatas(transFormDatas): void {
    const viewDatas = this.wbsService.pageDatas;
    const start = this.loopCount;
    const pageSize = 10;
    const pageData = transFormDatas.slice(start, start + pageSize);
    if (start === 0) {
      const differences = diff(viewDatas, pageData);
      if (differences) {
        this.wbsService.pageDatas = [...pageData];
      }
      sessionStorage.setItem(
        `pcc_wbs_data_project_no_${this.wbsService.project_no}`,
        JSON.stringify(pageData)
      );
    } else {
      this.wbsService.pageDatas = [...viewDatas, ...pageData];
    }
    this.loopCount += pageSize;
    this.changeRef.markForCheck();
  }

  /**
   * 1、项目基础维护、进度追踪、模板，页面初始化
   * 2、项目基础维护、模板，任务卡增删改
   * 3、项目基础维护、模板，任务移动
   * 4、选择目标 - 职能目标、子项开窗 - 使用模板
   * 检查项目下任务占比是否符合100%的规则(敏态)
   */
  checkTaskProportion(): void {
    const project_no =
      this.wbsService.project_no ?? this.addSubProjectCardService.firstLevelTaskCard.project_no;
    // 2023-S8 更换api [入参、出参]：'task.proportion.check' ==> 'bm.pisc.task.proportion.check'
    this.commonService
      .getTaskProportionInfo(this.source, project_no, {
        ...this.wbsService.projectInfo,
        change_version: this.wbsService.change_version,
      })
      .subscribe((res: any): void => {
        if (res.data && res.data?.project_info) {
          const project_info = res.data?.project_info;
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
      });
  }

  triggerDrop(i, val): void {
    const item = this.wbsService.pageDatas[i];
    item.disabled = val;
    this.disableChild(item, val);
  }

  disableChild(item: any, val: boolean): void {
    item.children?.forEach((o: any): void => {
      o.disabled = val;
      this.disableChild(o, val);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tabName === 'app-dynamic-wbs' && this.source === Entry.card) {
      this.getProjectChangeStatus(this.wbsService.project_no);
    }
    // 同步项目基本信息修改项目类型带入is_approve，is_attachment更新wbs数据
    if (changes.changeConfigData?.currentValue) {
      this.editTask();
    }
    if (changes.projectTemplateMaintainData?.currentValue) {
      const { currentValue } = changes.projectTemplateMaintainData;
      this.getDatas(currentValue);
    }
  }

  /**
   * 存在T100的任务，hasT100=true
   */
  getTenantProductOperationList(): void {
    const tenantId = this.userService.getUser('tenantId');
    this.wbsService.getTenantProductOperationList(tenantId).subscribe(
      (res: any) => {
        this.hasT100 =
          res.prod_eoc_mapping.filter((item) => {
            return item.prod_name === 'T100';
          }).length > 0;
      },
      (error) => {}
    );
  }

  /**
   * 初始化数据 供wbs列表展示拖拽控制编辑删除按钮展示
   * @param list wbs原始数据
   * @returns data 按照分组展示的数据
   */
  transformData(list: any): any {
    const listObj = this.getListObj(list);
    const groupList = this.getGroupList(list, listObj);
    this.initParentIdList();
    this.initTrackPagesData(groupList);
    this.filterBySequence(groupList);
    this.setDropDisable(groupList);
    this.wbsService.cardLevelHandle(groupList, 0);
    this.wbsService.calculationChildrenLength(groupList);
    return groupList;
  }

  /**
   * 获取任务卡列表对象
   * @param list 所有任务卡
   * @returns
   */
  getListObj(list: any[]): {} {
    const listObj = {};
    list.forEach((listItem: any): void => {
      const item = {
        disabled: !this.wbsService.editable,
        task_status: Number(listItem.task_status), // 任务状态
        complete_rate_gatter: listItem.complete_rate, // 完成率
        complete_rate:
          listItem.complete_rate <= 1
            ? multiple(listItem.complete_rate, 100)
            : listItem.complete_rate, // 容错外面已经处理过
        // complete_rate: listItem.complete_rate <= 1 ? Math.floor(listItem.complete_rate * 100) : listItem.complete_rate, // 容错外面已经处理过
        isChildrenshow: true, // 默认展开所有节点
        isOperationsShow: false, // 默认收起操作列表
        children: [], // 子任务
        switch: false,
        sequence: Number(listItem.sequence) ?? '', // 顺序：由前端记录任务新增的顺序
      };
      listItem = Object.assign(listItem, item);
      // 当编辑任务卡时，点击人员同值或日期同值不关闭编辑页面
      // if (item.innerSwitch) {
      //   //  编辑的时候，controlSwitch和currentCardInfo 是一样的，代表当前编辑任务卡信息学
      //   this.addSubProjectCardService.controlSwitch = listItem;
      //   this.addSubProjectCardService.currentCardInfo = listItem;
      // }
      // 是否已发任务卡	true：是 false：否
      if (listItem.is_issue_task_card) {
        const parentId = this.wbsService.parentId(
          this.wbsService.allTaskCardList,
          listItem.task_no
        );
        this.parentIdList.push(parentId);
      }
      listObj[listItem.task_no] = listItem;
    });
    return listObj;
  }

  /**
   * 将任务卡按照上阶任务关系分组
   * @param list 所有任务卡
   * @param listObj 任务卡列表对象
   * @returns
   */
  getGroupList(list: any[], listObj: {}): any[] {
    const groupList = [];
    list.forEach((item: any): void => {
      // 	上阶任务编号
      if (
        item.upper_level_task_no &&
        listObj[item.upper_level_task_no] &&
        item.upper_level_task_no !== item.task_no
      ) {
        listObj[item.upper_level_task_no].children.push(item);
      } else {
        groupList.push(item);
      }
    });
    return groupList;
  }

  /**
   * 获取树父级id列表
   */
  initParentIdList(): void {
    this.parentIdList = Array.from(new Set(this.parentIdList));
  }

  /**
   * 进度追踪页面需处理任务状态
   * @param groupList 按照上阶任务关系分组后的任务列表
   * @returns
   */
  initTrackPagesData(groupList: any[]): void {
    // if (!this.wbsService.isTrackPages) {
    //   return;
    // }
    this.statusHandle(groupList);
  }

  /**
   * 获取初始化数据后得所有任务信息供甘特图使用
   * @param list 任务卡列表
   * @returns
   */
  getAllDatas(list): any {
    let allList = [];
    list.forEach((item: any) => {
      allList.push(item);
      if (item.children?.length) {
        const childrenList = this.getAllDatas(item.children);
        allList = [...allList, ...childrenList];
      }
    });
    return allList;
  }

  /**
   * 设置是否可以拖拽
   * @param data 分组数据
   */
  setDropDisable(data): void {
    data.forEach((res: any): void => {
      this.parentIdList.forEach((item: any): void => {
        if (res.task_no === item) {
          res.disabled = true;
          if (res.children?.length) {
            this.addCardStatus(res);
          }
        }
      });
    });
  }

  addCardStatus(current: any): void {
    current.children.forEach((item: any): void => {
      item.disabled = true;
      if (item.children?.length) {
        this.addCardStatus(item);
      }
    });
  }

  sortBySequence(a, b): any {
    return a.sequence - b.sequence;
  }

  /**
   * 任务卡排序
   * @param data 分组数据
   */
  filterBySequence(data: any): void {
    data.sort(this.sortBySequence);
    data.forEach((item: any, index: any): void => {
      if (item.children?.length) {
        this.filterBySequence(item.children);
      }
    });
  }
  statusHandle(data: any): void {
    data.forEach((item: any): void => {
      this.corridorChildrens = [];
      const childrens = this.treeToArray(item.children);
      // 10: 未开始, 20: 进行中, 30: 已完成
      item.status =
        childrens.length > 0
          ? childrens.every((childrensItem) => childrensItem.task_status === 30)
            ? 30
            : childrens.every((childrensItem) => childrensItem.task_status === 10)
            ? 10
            : 20
          : item.task_status;
      // 有子卡，进行中要判断是否有逾期或者异常
      if (item.status === 10 || item.status === 20 || item.status === 30 || item.status === 60) {
        childrens.forEach((child) => {
          item.isOverdue = this.wbsService.overdueDays(child) ? true : false;
        });
        this.isOverdue(item);
      }
      // 无子卡，根据自身逾期情况判断
      if (childrens?.length === 0) {
        item.isOverdue = this.wbsService.overdueDays(item) ? true : false;
      }
    });
  }

  /**
   * 数据平铺， 判断甬道内的第一张卡片的状态
   * @param children 甬道内的第一个children
   * @returns
   */
  treeToArray(children): any {
    children.map((item): void => {
      this.corridorChildrens = this.corridorChildrens.concat(item);
      if (item.children?.length) {
        this.treeToArray(item.children);
      }
    });
    return this.corridorChildrens;
  }

  /**
   * 进行中时判断当前卡片是否逾期&&根据子卡判断上层父卡的状态
   * @param children
   */
  isOverdue(item): void {
    item.children.forEach((child): void => {
      if (
        child.task_status === 10 ||
        child.task_status === 20 ||
        child.task_status === 30 ||
        child.task_status === 60
      ) {
        if (this.wbsService.overdueDays(child)) {
          child.isOverdue = true;
          item.isOverdue = true;
        }
        if (child.children?.length) {
          this.isOverdue(child);
        }
      }
    });
  }

  /**
   * 点击空白处关闭操作
   * @param data
   */
  closeOperation(data): void {
    data.forEach((item) => {
      item.isOperationsShow = item.isOperationsShow ? false : true;
      if (item.children?.length) {
        this.closeOperation(item.children);
      }
    });
  }

  isCollaborationCardNoMove(task_no): boolean {
    const obj = this.wbsService.getParentTree(task_no);
    const condition = obj && obj['isCollaborationCard'] && this.source === Entry.card;
    return condition ? true : false;
  }

  // 找到每组计划中，下阶任务的任务比重<1的，返回每组计划的任务的task_no 项目变更
  hasTaskProportionCheckForPC(data): boolean {
    let taskNos: Set<string> = new Set();
    // + 检查各一级任务的整棵树下，是否存在任务比重<100%
    let array: Array<string> = [];
    this.wbsService.pageDatas.forEach((element) => {
      const arr: Array<string> = [];
      const flag: Array<string> = [];
      this.getUpperTask(element, arr, flag);
      if (flag[0]) {
        array = [...array, ...arr];
      }
    });
    taskNos = new Set([...array].filter((v) => v !== ''));
    return taskNos.has(data.task_no);
  }
  dropListSortPredicate(index: number, item: CdkDrag<number>) {
    return !this.dragDisabledIndex.has(index);
  }
  // 拖拽方法调用
  async onDrop(e: DragDropService, target, index): Promise<void> {
    const root = this.wbsService.getParentTree(e.dragData.item.task_no);
    const targetRoot = this.wbsService.getParentTree(target.task_no);
    if (this.source === Entry.projectChange) {
      if (this.wbsService.projectChangeDoc?.change_status !== '1' || this.hasT100) {
        return;
      } else {
        if (
          e.dragData.item.upper_level_task_no &&
          e.dragData.item.task_no !== e.dragData.item.upper_level_task_no
        ) {
          const result = await this.commonService
            .getInvData('bm.pisc.project.change.task.detail.get', {
              excluded_already_deleted_task: true,
              project_change_task_detail_info: [
                {
                  project_no: this.wbsService.project_no,
                  change_version: this.wbsService.change_version,
                  root_task_no: root?.task_no,
                  old_is_issue_task_card: true,
                },
                {
                  project_no: this.wbsService.project_no,
                  change_version: this.wbsService.change_version,
                  root_task_no: targetRoot?.task_no,
                  old_is_issue_task_card: true,
                },
              ],
            })
            .toPromise();
          if (result?.data.project_change_task_detail_info?.length > 0) {
            return;
          }
        }
      }
    }
    const dragDataFlag = this.isCollaborationCardNoMove(e.dragData.item.task_no);
    const targetFlag = this.isCollaborationCardNoMove(target.task_no);
    if (dragDataFlag || targetFlag) {
      return;
    }
    // 一级计划，自身拖动未改变位置，不可拖拽进行禁止
    if (
      e.dragData.item.disabled ||
      target.disabled ||
      e.dragData.item.task_no === target.task_no ||
      e.dragData.item.task_no === e.dragData.item.upper_level_task_no ||
      !e.dragData.item.upper_level_task_no
    ) {
      return;
    }
    // spring 2.7 PCC整合T100 - 同步WBS管控不可拖拽
    if (this.isDragDropEnd()) {
      return;
    }

    const finder1 = this.wbsService.hasTaskProportionForThisTree(e.dragData.item.task_no);
    const finder2 = this.wbsService.hasTaskProportionForThisTree(target.task_no);
    if (finder1 || finder2) {
      return;
    }
    if (this.source === Entry.projectChange) {
      e.dragData.item.root_task_no = targetRoot?.task_no;
    }
    this.wbsService.onDrop(
      e,
      target,
      () => {
        this.changeRef.markForCheck();
      },
      this.source,
      index
    );
  }

  /**
   * 判断是否可以进行，一级拖拽调用接口改变sequence
   * @returns true，不可以
   */
  isDragDropEnd() {
    if (this.source === Entry.projectChange) {
      return this.hasT100 || this.wbsService.projectChangeDoc?.change_status !== '1';
    }
    return (
      this.hasT100 &&
      this.hasGroundEnd === 'Y' &&
      this.wbsService.projectInfo?.project_status !== '10'
    );
  }
  isDragDisabled(data, index) {
    const flag =
      !this.wbsService.editable ||
      data.disabled ||
      data.is_issue_task_card ||
      this.isCollaborationCardNoMove(data.task_no);
    if (flag) {
      this.dragDisabledIndex.add(index);
    } else {
      this.dragDisabledIndex.delete(index);
    }
    return flag;
  }
  seCorridorDragWrapperHeight(parentDom: HTMLElement) {
    let parentDomHeight = this.isCorridorDragging
      ? parentDom['_cacheOffsetHeight']
      : parentDom['_cacheScrollHeight'];

    if (parentDomHeight) {
      return parentDomHeight + 'px';
    }
    requestAnimationFrame(() => {
      if (this.isCorridorDragging) {
        parentDomHeight = parentDom.offsetHeight;
        parentDom['_cacheOffsetHeight'] = parentDomHeight;
      } else {
        parentDomHeight = parentDom.scrollHeight;
        parentDom['_cacheScrollHeight'] = parentDomHeight;
      }
      this.seCorridorDragWrapperHeight(parentDom);
    });
  }
  isCorridorDragging = false;
  corridorDraggingIndex = -1;
  corridorDragStarted(e, i: number) {
    this.isCorridorDragging = true;
    this.corridorDraggingIndex = i;
  }
  corridorDragEnded(e) {
    // 这里加上延迟防止监听wbsBox和wbsWrapper触发dom变化监听
    setTimeout(() => {
      this.isCorridorDragging = false;
      this.corridorDraggingIndex = -1;
      this.changeRef.markForCheck();
    });
  }
  corridorDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    // 补：spring 2.7 PCC整合T100 - 同步WBS管控不可拖拽
    // 一级（整棵树）的拖拽管控
    if (
      this.isDragDropEnd() ||
      !this.wbsService.editable ||
      this.wbsService.projectInfo?.project_status === '20'
    ) {
      return;
    }
    // 修复：spring 1.8 拖拽功能管控
    // 一级（整棵树）的拖拽管控
    const finder = [];
    const pageDatas = this.wbsService.pageDatas || [];
    if (pageDatas && pageDatas.length) {
      const findChildren = this.wbsService.pageDatas[event.previousIndex];
      this.getTaskChildrenAnyKey(findChildren, 'is_issue_task_card', true, finder);
    }
    if (finder && finder?.length > 0) {
      return;
    }
    moveItemInArray(pageDatas, event.previousIndex, event.currentIndex);
    this.dragDropEnd(event);
  }
  /**
   * 递归方法：查找的父节点的所有子节点中是否有满足条件集合
   * @param children  一组任务信息的集合
   * @param key 查找的节点对象的属性
   * @param value 查找的节点对象的属性值
   * @param finder 查找的父节点的所有子节点
   */
  getTaskChildrenAnyKey(children, key: string, value: any, finder: Array<any>) {
    if (children) {
      if (children[key] === value) {
        finder.push(children.children);
      }
      if (children && children.children && children.children?.length) {
        children.children.forEach((v) => {
          this.getTaskChildrenAnyKey(v, key, value, finder);
        });
      }
    }
  }
  /**
   *  一级拖拽调用接口改变sequence
   * @param event
   */
  dragDropEnd(e): void {
    // 补：spring 2.7 PCC整合T100 - 同步WBS管控不可拖拽
    // 一级（整棵树）的拖拽管控
    if (this.isDragDropEnd()) {
      return;
    }
    this.wbsService.pageDatas.forEach((res, index): void => {
      res.sequence = index + 1;
    });
    const task_info = cloneDeep(this.wbsService.pageDatas);

    task_info.forEach((el) => {
      el.doc_type_info = el.doc_condition_value.split(',').map((item) => {
        return { doc_condition_value: item };
      });
    });

    let url = 'task.base.info.update';
    let paramser = {
      task_info: task_info.map((o): any => {
        o.is_update_upper_date = 'Y';
        o.task_status = String(o.task_status);
        o.task_property = this.source === Entry.maintain ? '2' : '1';
        return o;
      }),
    };
    if (this.source === Entry.projectChange) {
      url = 'bm.pisc.project.change.task.detail.update';
      paramser = {
        // @ts-ignore
        sync_steady_state: this.hasGroundEnd !== 'Y' ? null : 'Y',
        is_update_task_date: false,
        is_check_task_dependency: false,
        project_change_task_detail_info: task_info.map((o): any => {
          o.plan_work_hours = o.plan_work_hours === '' ? 0 : o.plan_work_hours;
          o.task_status = String(o.task_status);
          return o;
        }),
      };
    }

    this.commonService.getInvData(url, paramser).subscribe((res): void => {
      this.changeRef.markForCheck();
    });
  }
  addWbsFirstPlanDragStarted() {
    this.addFirstPlanStartDrag = true;
  }
  addWbsFirstPlanDragEnded() {
    setTimeout(() => {
      this.addFirstPlanStartDrag = false;
      this.changeRef.markForCheck();
    });
  }
  /**
   * 添加一级计划
   * @param value
   */
  addFirstItem(value: any): void {
    if (this.addFirstPlanStartDrag) {
      this.addFirstPlanStartDrag = false;
      return;
    }
    // 无用代码起始端
    // 首阶或targetCart
    // if (this.addSubProjectCardService.controlSwitch?.innerSwitch) {
    //   // 左下角(+) 打开的子项开窗
    //   this.addSubProjectCardService.controlSwitch.innerSwitch = false;
    // }
    // this.wbsService.pageDatas.forEach((data: any): void => {
    //   // 添加子项
    //   data.switch = false;
    // });
    // 新建一级计划
    // this.wbsService.firstPlanSwitch = true;
    // 无用代码末端
    const title = this.translateService.instant('dj-default-新建一级计划');
    if (this.source === Entry.card) {
      this.commonService
        .getProjectChangeStatus(this.wbsService?.project_no, ['1', '2', '4', '5'], '1')
        .subscribe(
          (resChange: any): void => {
            this.addSubProjectCardService.openAddSubProjectCard(title, ButtonType.CREATE);
            this.addSubProjectCardService.showAddTaskCard = true;
            this.changeRef.markForCheck();
          },
          (error) => {}
        );
    } else {
      this.addSubProjectCardService.openAddSubProjectCard(title, ButtonType.CREATE);
    }
  }

  /**
   * 添加子项
   * @param card 任务卡
   */
  addSubItem(firstLevelTaskCard: any): void {
    // 无用代码起始端
    // if (this.addSubProjectCardService.controlSwitch?.innerSwitch) {
    //   this.addSubProjectCardService.controlSwitch.innerSwitch = false;
    // }
    // this.wbsService.firstPlanSwitch = false;
    // this.wbsService.pageDatas.forEach((data) => {
    //   if (data.task_no !== firstLevelTaskCard?.task_no) {
    //     data.switch = false;
    //   }
    // });
    // firstLevelTaskCard.switch = true;
    // 无用代码末端
    const title = this.translateService.instant('dj-default-添加子项');
    if (this.source === Entry.card) {
      this.commonService
        .getProjectChangeStatus(this.wbsService?.project_no, ['1', '2', '4', '5'], '1')
        .subscribe(
          (resChange: any): void => {
            this.addSubProjectCardService.openAddSubProjectCard(
              title,
              ButtonType.ADD,
              firstLevelTaskCard
            );
            this.addSubProjectCardService.showAddTaskCard = true;
            this.changeRef.markForCheck();
          },
          (error) => {}
        );
    } else {
      this.addSubProjectCardService.openAddSubProjectCard(
        title,
        ButtonType.ADD,
        firstLevelTaskCard
      );
    }
  }

  findParentCard(cardList, card): void {
    if (!card.upper_level_task_no) {
      card.level = 0;
      card.children = [];
      cardList.push(card);
      return;
    }
    cardList.forEach((item) => {
      if (item.task_no === card.upper_level_task_no) {
        card.level = item.level + 1;
        if (item.disabled) {
          card.disabled = true;
        }
        item.children.push(card);
        this.changeRef.markForCheck();
      } else {
        if (item.children && item.children?.length) {
          this.findParentCard(item.children, card);
        }
      }
    });
  }

  deleteCardInTree(root, currentCard): void {
    for (let i = 0; i < root.children?.length; i++) {
      const item = root.children[i];
      if (item.task_no === currentCard.task_no) {
        root.children.splice(i, 1);
        break;
      } else {
        if (item.children && item.children?.length) {
          this.deleteCardInTree(item, currentCard);
        }
      }
    }
  }

  getEditTaskCardInfo(card: any): void {
    if (!card.children) {
      card.children = [];
    }
    if (this.addSubProjectCardService.currentCardInfo) {
      const corridorData = this.wbsService.getCurrentCorridor(card);
      if (
        this.addSubProjectCardService.currentCardInfo['upper_level_task_no'] ===
        card.upper_level_task_no
      ) {
        Object.assign(this.addSubProjectCardService.currentCardInfo, card);
      } else {
        this.deleteCardInTree(corridorData, this.addSubProjectCardService.currentCardInfo);
        this.findParentCard(this.wbsService.pageDatas, card);
      }
    }
  }

  monitorAddTaskInfo(): void {
    this.newTaskSubscribed = this.wbsService.$newCardInfo.subscribe((card: any) => {
      if (card.task_name) {
        card.isChildrenshow = true;
        card.isOperationsShow = false;
        card.children = [];
        if (this.addSubProjectCardService.buttonType === 'CREATE') {
          card.level = 0;
          this.wbsService.pageDatas.push(card);
          this.changeRef.markForCheck();
        } else {
          if (this.addSubProjectCardService.buttonType === 'EDIT') {
            card.children = this.addSubProjectCardService.currentCardInfo['children'];
            this.getEditTaskCardInfo(card);
          } else {
            this.findParentCard(this.wbsService.pageDatas, card);
          }
          this.wbsService.cardLevelHandle(this.wbsService.pageDatas, 0);
          this.wbsService.calculationChildrenLength(this.wbsService.pageDatas);
        }
        this.getFirstTaskListInfo();
      }
      this.ganttAndPertData = this.getAllDatas(
        JSON.parse(JSON.stringify(this.wbsService.pageDatas))
      );
    });
  }

  getAddTaskCardInfo(card: any, isFirstPlan?: boolean): void {
    card.isChildrenshow = true;
    card.isOperationsShow = false;
    card.children = [];
    console.log(card);
    if (isFirstPlan && isFirstPlan === true) {
      card.level = 0;
      this.wbsService.pageDatas.push(card);
    } else {
      this.findParentCard(this.wbsService.pageDatas, card);
    }
  }

  /**
   * 根据项目状态展示中文
   * @param status 项目状态
   * @returns
   */
  getProjectStatus(status): string {
    const statusList = {
      '10': this.translateService.instant('dj-default-未开始'),
      '20': this.translateService.instant('dj-c-签核中'),
      '30': this.translateService.instant('dj-default-进行中'),
      '40': this.translateService.instant('dj-default-已结案'),
      '50': this.translateService.instant('dj-default-暂停'),
      '60': this.translateService.instant('dj-default-指定结案'),
    };
    return statusList[status];
  }

  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }

  markForCheck() {
    this.projectPlanCard?.changeRef?.markForCheck();
    this.wbsHeader?.changeRef?.markForCheck();
    this.changeRef.markForCheck();
  }

  /**
   * 关闭进度追送任务进度详情弹框
   */
  closeMask(): void {
    this.wbsService.taskDetail = false;
  }

  /**
   * 获取可协同排定的任务卡：拥有负责人，起始日期
   */
  getFirstTaskListInfo() {
    // 一级计划捞取方式:
    if (this.wbsService.projectInfo?.project_status === '30') {
      const param = { task_info: [{ project_no: this.wbsService.projectInfo?.project_no }] };
      // 取得协同合作任务计划信息
      this.wbsService.firstTaskCardList = this.wbsService.pageDatas.filter((task) => {
        return (
          task.liable_person_code &&
          !['PCM', 'ASSC_ISA_ORDER'].includes(task.task_category) &&
          task.complete_rate < 100 &&
          task.upper_level_task_no === task.task_no
        );
      });
      this.changeRef.markForCheck();
    } else {
      // 启动前(项目状态=10.未开始)
      this.wbsService.firstTaskCardList = this.wbsService.pageDatas.filter(
        (task: any) =>
          task.liable_person_code && !['PCM', 'ASSC_ISA_ORDER'].includes(task.task_category)
      );
    }
  }

  editTask(): void {
    this.editTaskData = [];
    const pageData = JSON.parse(JSON.stringify(this.wbsService.pageDatas));
    this.getEditData(pageData);
    this.editTaskData.forEach((item) => {
      item.task_status = String(item.task_status);
      item.task_property = this.source === Entry.maintain ? '2' : '1';
    });
    const params = {
      task_info: this.editTaskData,
    };
    this.commonService.getInvData('task.base.info.update', params).subscribe((res: any): void => {
      this.getTaskInfo();
      this.changeRef.markForCheck();
    });
  }

  getEditData(data): void {
    data.forEach((dataItem: any): void => {
      dataItem.is_approve = this.changeConfigData.is_approve
        ? this.changeConfigData.is_approve
        : false;
      dataItem.is_attachment = this.changeConfigData.is_attachment
        ? this.changeConfigData.is_attachment
        : false;
      // dataItem.task_status = String(dataItem.task_status);
      this.editTaskData.push(dataItem);
      if (dataItem.children?.length) {
        this.getEditData(dataItem.children);
      }
    });
  }

  /**
   * 关闭人力资源负荷
   * @param event
   */
  changeMaskStatus(event): void {
    this.wbsService.showHRLoad = event;
  }

  // PERT图全屏
  toFullScreen(): void {
    this.wbsService.fullScreenStatus = !this.wbsService.fullScreenStatus;
    this.changeRef.markForCheck();
  }

  getProjectStatustypeNo(): boolean {
    return (
      this.wbsService.projectInfo?.project_status === '10' &&
      !this.wbsService.projectInfo?.project_type_no
    );
  }

  // 项目已启动，任务比重校验不通过，屏蔽按钮功能
  getTaskProportionCheck(): boolean {
    // 存在一级任务的任务比重<100% ==> 整个计划维护页面禁用WBS的删除功能、添加子项功能、新建一级计划
    if (Number(this.wbsService.projectInfo?.project_status) > 20 && this.source === Entry.card) {
      return this.wbsService.pageDatas.find((element) => element.task_proportion < 1) !== undefined;
    } else {
      return false;
    }
  }

  // 找到每组计划中，下阶任务的任务比重<1的，返回每组计划的任务的task_no
  getUpperTask(children, array, flag) {
    if (children) {
      array.push(children.task_no);
      if (children.task_proportion < 1) {
        flag.push(true);
      }
      if (children.children?.length) {
        children.children.forEach((v) => {
          this.getUpperTask(v, array, flag);
        });
      }
    }
  }

  // 项目已启动，检查各一级任务的整棵树下，是否存在任务比重<100%，禁用整棵树的删除功能、添加子项功能、增加下阶任务(+)
  hasTaskProportionCheck(data): boolean {
    let taskNos: Set<string> = new Set();
    if (Number(this.wbsService.projectInfo?.project_status) > 20 && this.source === Entry.card) {
      // + 检查各一级任务的整棵树下，是否存在任务比重<100%
      let array: Array<string> = [];
      this.wbsService.pageDatas.forEach((element) => {
        const arr: Array<string> = [];
        const flag: Array<string> = [];
        this.getUpperTask(element, arr, flag);
        if (flag[0]) {
          array = [...array, ...arr];
        }
      });
      taskNos = new Set([...array].filter((v) => v !== ''));
    }
    return taskNos.has(data.task_no);
  }

  export_data(scales): void {
    this.ganttComponent.export_data(scales);
  }

  export_data_pdf(): void {
    this.ganttComponent.export_data_pdf();
  }

  switchApproveAction(status): string {
    let approve_action;
    switch (status) {
      case '10':
        approve_action = this.translateService.instant('dj-pcc-发起');
        break;
      case '20':
        approve_action = this.translateService.instant('dj-pcc-签核中');
        break;
      case '30':
        approve_action = this.translateService.instant('dj-default-继续专案');
        break;
      case '31':
        approve_action = this.translateService.instant('dj-default-继续专案');
        break;
      case '40':
        approve_action = this.translateService.instant('dj-pcc-结案');
        break;
      case '50':
        approve_action = this.translateService.instant('dj-pcc-暂停专案');
        break;
      case '60':
        approve_action = this.translateService.instant('dj-pcc-指定结案');
        break;
      case '00':
        approve_action = this.translateService.instant('dj-pcc-无');
        break;
    }
    return approve_action;
  }

  /**
   * 根据任务状态展示中文
   * @param status
   * @returns
   */
  switchProjectStatus(status): string {
    let title;
    switch (status) {
      case '10':
        title = this.translateService.instant('dj-default-未开始');
        break;
      case '30':
        title = this.translateService.instant('dj-default-进行中');
        break;
      case '40':
        title = this.translateService.instant('dj-default-已结案');
        break;
      case '50':
        title = this.translateService.instant('dj-default-暂停');
        break;
      case '60':
        title = this.translateService.instant('dj-default-指定结案');
        break;
      case '20':
        title = this.translateService.instant('dj-pcc-签核中');
        break;
    }
    return title;
  }

  readFn() {
    const task_list = this.initData?.filter((item) => item.update_flag === true);
    if (!task_list.length) {
      return;
    }
    const task_no_list = task_list.map((item) => item.task_no);
    this.commonService
      .getInvData('bm.pisc.task.update', {
        is_check_task_dependency: false,
        is_update_task_date: false,
        sync_steady_state: 'N',
        task_info: task_no_list.map((taskNo) => {
          return {
            project_no: this.wbsService.project_no,
            task_no: taskNo,
            task_property: '1',
            update_flag: false,
          };
        }),
      })
      .subscribe(
        (res) => {
          this.wbsService.pageChange.next(true);
        },
        (error) => {
          this.wbsService.pageChange.next(true);
        }
      );
  }

  initReadFn(): void {
    this.callReadFn$.pipe(debounceTime(200)).subscribe((change: any) => {
      this.readFn();
    });
  }

  callReadFn() {
    this.callReadFn$.next();
  }

  // 所有根任务比重不小于100%
  hasTaskProportionForRoot(): boolean {
    let flag = false;
    this.wbsService.pageDatas.forEach((element) => {
      if (element.task_proportion < 1) {
        flag = true;
      }
    });
    return flag;
  }

  getPropertyColor() {
    let color = '34,163,86';
    if (this.wbsService.projectInfo.project_property === '10') {
      color = '97,103,204';
    }
    return {
      background: `rgba(${color},0.1)`,
      border: `1px solid rgba(${color},1)`,
      color: `rgba(${color},1)`,
    };
  }
  getStatusColor() {
    let color = '109,126,156';
    const status =
      this.source === Entry.projectChange
        ? this.wbsService.projectInfo?.old_project_status
        : this.wbsService.projectInfo?.project_status;
    switch (status) {
      case '10':
        color = '109,126,156';
        break;
      case '30':
        color = '0,81,225';
        break;
      case '40':
        color = '34,163,86';
        break;
      case '50':
        color = '34,67,93';
        break;
      case '60':
        color = '255,106,49';
        break;
      case '20':
        color = '97,103,204';
        break;
    }
    return {
      background: `rgba(${color},0.1)`,
      border: `1px solid rgba(${color},1)`,
      color: `rgba(${color},1)`,
    };
  }
}
