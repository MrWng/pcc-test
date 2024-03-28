import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  Output,
  EventEmitter,
  SimpleChanges,
  ViewChild,
  OnChanges,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicUserBehaviorCommService,
  PluginLanguageStoreService,
  reportedUserBehavior,
  UserBehaviorOperation,
} from '@ng-dynamic-forms/core';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { DynamicWbsService } from './wbs.service';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { CommonService, Entry } from '../../service/common.service';
import { DragDropService } from '../../directive/dragdrop/dragdrop.service';
import { OnDestroy } from '@angular/core';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';
import { cloneDeep } from '@ng-dynamic-forms/core';
import { DwUserService } from '@webdpt/framework/user';
import { diff } from 'deep-diff';
import { DynamicGanttComponent } from '../gantt/gantt.component';
import { AfterViewInit } from '@angular/core';
import { DependencyInfoList, TaskInfo, CriticalPath } from './wbs.interface';
import { ButtonType } from '../add-subproject-card/add-subproject-card.interface';


@Component({
  selector: 'app-dynamic-wbs',
  templateUrl: './wbs.component.html',
  styleUrls: ['./wbs.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicWbsComponent
  extends DynamicFormControlComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() source: Entry = Entry.card
  @ViewChild('dynamicGantt') ganttComponent: DynamicGanttComponent;
  // 项目模版维护数据
  @Input() projectTemplateMaintainData: any = [];
  @Input() changeConfigData: any;

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();

  public destroy$ = new Subject<void>();

  // wbs入口
  Entry = Entry
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
  private loopCount = 0
  addSubItemCode: string;
  addFirstItemCode: any;

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
  ) {
    super(layoutService, validationService, changeRef, elementRef);
    this.addSubItemCode = 'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON005';
    this.addFirstItemCode = 'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON001';
  }
  get isApproveStatus() {
    return this.wbsService.projectInfo.approve_status === 'N';
  }

  ngOnInit(): void {

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
      this.source === Entry.card ? this.getTaskInfo() : this.getDatas(this.projectTemplateMaintainData);
    }
    /** 获取首屏缓存的数据用于展示 */
    const storageFirstScreenData = sessionStorage.getItem(`pcc_wbs_data_project_no_${this.wbsService.project_no}`) || '';
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

    this.checkTaskProportion();
    // wbs卡片删除，新建调用修改service数据
    this.monitorAddTaskInfo();
    // 卡片使用模板 重新获取数据 pert图等数据
    this.monitorTaskInfoGet();
    // 计划维护||进度追送调用获取甘特图和pert图数据
    if ([Entry.card, Entry.maintain].includes(this.source)) {
      this.getCriticalPath();
      this.getDependencyInfo();
    }
    this.monitorUpdateTaskCards();
    this.monitorTaskProportionChange();
  }

  monitorUpdateTaskCards(): void {
    this.wbsService.pageChange.subscribe((res) => {
      this.getTaskInfo(res);
    });
  }


  monitorTaskProportionChange(): void {
    this.wbsService.$checkProportion.subscribe((res) => {
      this.changeWbsTaskProportion();
    });
  }

  // 项目计划流程
  getProjectPlanFlow() {
    this.commonService.getMechanismParameters('projectPlanFlow').toPromise().then(res => {
      // 1: PM独自完成项目计划(不需协同计划)
      // 2: 协同计划(一定需要协同计划)
      // 3: 混合计划(两种同时存在)
      this.projectPlanningProcessType = res.data?.projectPlanFlow ? res.data?.projectPlanFlow : '-1';
      this.changeRef.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.removeSessionStorage();
    this.removeListeners();
  }

  private removeListeners(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private removeSessionStorage(): void {
    sessionStorage.removeItem('hasEditFromProjectNo');
    sessionStorage.removeItem('hasEditFromTaskNoArr');
  }

  /**
   * 获取任务卡信息
   */
  getTaskInfo(target?: any): void {
    forkJoin([
      this.commonService.getTaskInfo(this.wbsService.project_no, this.source),
      this.commonService.getCollaborationCard(this.wbsService.project_no),
    ])
      .pipe(map((responses): any => responses.map((item): any => item.data)), takeUntil(this.destroy$))
      .subscribe(
        (value) => {
          const project_info = value[0].project_info ?? [];
          this.wbsService.allTaskCardList = project_info;
          this.getDatas(project_info, target);
          this.getFirstTaskListInfo();
          // spring 3.2 更换api名称 [入参、出参]：'teamwork.task.plan.info.get' ==> 'bm.pisc.assist.schedule.get'
          const task_info = value[1].assist_schedule_info ?? [];
          const task_info_list = task_info.map((infoItem) => infoItem.task_no);
          this.wbsService.pageDatas.forEach(dataItem => {
            if (task_info_list.includes(dataItem.task_no)) {
              this.wbsService.hasCollaborationCard = true;
              dataItem.noEdit = true;
              dataItem.isCollaborationCard = true;
            }
          });
          this.changeRef.markForCheck();
        });
  }

  getDatas(data: any, target?: any): void {
    this.loopCount = 0;
    const transFormDatas = this.transformData(JSON.parse(JSON.stringify(data)), target);
    this.wbsService.pageDatas = transFormDatas;
    // this.loopTask(transFormDatas);
    this.ganttAndPertData = this.getAllDatas(JSON.parse(JSON.stringify(transFormDatas)));
    this.datasLength = data.length;
  }

  /**
   * 后端接口未分页，前端使用时间分片渲染
   * @param data
   * @returns
   */
  loopTask(transFormDatas: any): void {
    if (this.loopCount > transFormDatas.length) { return; };
    this.updateDatas(transFormDatas);
    !!requestAnimationFrame ?
      requestAnimationFrame(() => { this.loopTask(transFormDatas); }) : setTimeout(() => { this.loopTask(transFormDatas); });
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
      sessionStorage.setItem(`pcc_wbs_data_project_no_${this.wbsService.project_no}`, JSON.stringify(pageData));
    } else {
      this.wbsService.pageDatas = [...viewDatas, ...pageData];
    }
    this.loopCount += pageSize;
    this.changeRef.markForCheck();
  }

  /**
   * 检查项目下任务占比是否符合100%的规则(敏态)
   */
  checkTaskProportion(): void {
    this.commonService.getInvData('task.proportion.check',
      {
        project_info:
          [{
            project_no: this.wbsService.project_no,
            task_property: this.source === Entry.maintain ? '2' : '1'
          }],
        check_all_task: '2'
      })
      .subscribe((res: any): void => {
        const { project_info, task_info } = res.data ?? {};
        this.wbsService.taskProportionCheck = {
          project_info,
          task_info,
          taskInfoTip: !!task_info.length,
          projectInfoTip: !!project_info.length,
          tip: !!task_info.length || !!project_info.length
        };
        this.changeRef.markForCheck();
      });
  }


  changeWbsTaskProportion() {
    this.commonService.getInvData('task.proportion.check',
      {
        project_info: [{
          project_no: this.wbsService.project_no,
          task_property: this.source === Entry.maintain ? '2' : '1'
        }],
        check_all_task: '2'
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any): void => {
        const { project_info, task_info } = res.data ?? {};
        this.wbsService.taskProportionCheck = {
          project_info,
          task_info,
          taskInfoTip: !!task_info.length,
          projectInfoTip: !!project_info.length,
          tip: !!task_info.length || !!project_info.length
        };
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
        this.hasT100 = res.prod_eoc_mapping.filter(item => { return item.prod_name === 'T100'; }).length > 0;
      },
      (error) => { }
    );
  }

  monitorTaskInfoGet(): void {
    this.useTaskTemplateSubscribed = this.wbsService.$useTaskTemplateStatus.subscribe(
      (res: any) => {
        if (res === true) {
          this.getTaskInfo();
          this.getCriticalPath();
          this.getDependencyInfo();
        }
      }
    );
  }

  /**
 * 初始化数据 供wbs列表展示拖拽控制编辑删除按钮展示
 * @param list wbs原始数据
 * @returns data 按照分组展示的数据
 */
  transformData(list: any, target?: any): any {
    const listObj = this.getListObj(list, target);
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
   * @param target 是否是人员同值或日期同值后的更新
   * @returns
   */
  getListObj(list: any[], target?: any): {} {
    const listObj = {};
    list.forEach((listItem: any): void => {
      const item = {
        disabled: !this.wbsService.editable,
        task_status: Number(listItem.task_status), // 任务状态
        complete_rate_gatter: listItem.complete_rate,  // 完成率
        complete_rate: listItem.complete_rate <= 1 ? Math.floor(listItem.complete_rate * 100) : listItem.complete_rate, // 容错外面已经处理过
        isChildrenshow: true, // 默认展开所有节点
        isOperationsShow: false,  // 默认收起操作列表
        children: [],  // 子任务
        switch: false,
        // innerSwitch: target?.task_no === listItem.no ? true : false,
        sequence: Number(listItem.sequence) ?? '',  // 顺序：由前端记录任务新增的顺序
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
        const parentId = this.wbsService.parentId(this.wbsService.allTaskCardList, listItem.task_no);
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
    if (!this.wbsService.isTrackPages) {
      return;
    }
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
      if (item.status === 10 || item.status === 20 || item.status === 30) {
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
      if (child.task_status === 10 || child.task_status === 20 || child.task_status === 30) {
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

  // 拖拽方法调用
  onDrop(e: DragDropService, target, index): void {
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
    this.wbsService.onDrop(e, target, () => { this.changeRef.markForCheck(); }, this.source, index);
  }

  /**
   * 判断是否可以进行，一级拖拽调用接口改变sequence
   * @returns true，不可以
   */
  isDragDropEnd() {
    return this.hasT100 && (this.hasGroundEnd === 'Y') && (this.wbsService.projectInfo?.project_status !== '10');
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

    task_info.forEach(el => {
      el.doc_type_info = el.doc_condition_value.split(',').map(item => {
        return { doc_condition_value: item };
      });;
    });
    this.commonService
      .getInvData('task.base.info.update', {
        task_info: task_info.map((o): any => {
          o.is_update_upper_date = 'Y';
          o.task_status = String(o.task_status);
          o.task_property = this.source === Entry.maintain ? '2' : '1';
          return o;
        }),
      })
      .subscribe((res): void => {
        this.changeRef.markForCheck();
      });
  }

  /**
  * 添加一级计划
  * @param value
  */
  addFirstItem(value: any): void {
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
    this.addSubProjectCardService.openAddSubProjectCard(title, ButtonType.CREATE);
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
    this.addSubProjectCardService.openAddSubProjectCard(title, ButtonType.ADD, firstLevelTaskCard);
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
        if (
          this.addSubProjectCardService.buttonType === 'CREATE'
        ) {
          card.level = 0;
          this.wbsService.pageDatas.push(card);
          this.changeRef.markForCheck();
        } else {
          if (
            this.addSubProjectCardService.buttonType === 'EDIT'
          ) {
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
      this.ganttAndPertData = this.getAllDatas(JSON.parse(JSON.stringify(this.wbsService.pageDatas)));
      this.getCriticalPath();
      this.getDependencyInfo();
    });
  }

  getAddTaskCardInfo(card: any, isFirstPlan?: boolean): void {
    card.isChildrenshow = true;
    card.isOperationsShow = false;
    card.children = [];
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
      this.wbsService.firstTaskCardList = this.wbsService.pageDatas.filter(task => {
        return task.liable_person_code && task.plan_start_date && task.plan_finish_date
          && (task.complete_rate < 100) && (task.upper_level_task_no === task.task_no);
      });
      this.changeRef.markForCheck();
    } else {
      // 启动前(项目状态=10.未开始)
      this.wbsService.firstTaskCardList = this.wbsService.pageDatas.filter(
        (task: any): void => task.liable_person_code && task.plan_start_date && task.plan_finish_date
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
    this.commonService
      .getInvData('task.base.info.update', params)
      .subscribe((res: any): void => {
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

  // 获取项目关键路径
  getCriticalPath(): void {
    let method = '';
    if (this.source === Entry.card) {
      method = 'card';
    }
    // 【项目模板】-- 增加传入：计算方式 = 2
    if (this.source === Entry.maintain) {
      method = 'maintain';
    }
    this.wbsService.projectCriticalPathInfoGet(method).then((task_info: TaskInfo[]) => {
      this.initCriticalPath(task_info);
    });
  }

  /**
* 根据task_no初始化关键路径
* @param task_info 任务卡信息
* @returns
*/
  initCriticalPath(task_info: TaskInfo[]): void {
    if (task_info.length <= 1) {
      return;
    }
    const arr = [];
    task_info.forEach((info, index) => {
      if (index > 0) {
        arr.push(
          {
            source: task_info[index - 1].task_no,
            target: info.task_no,
          }
        );
      }
    });
    this.criticalPath = arr;
  }

  /**
  * 获取项目任务依赖关系信息
  */
  getDependencyInfo(): void {
    this.wbsService.projectTaskDependencyInfoGet(this.source).then((task_info: TaskInfo[]) => {
      this.initDependencyInfo(task_info);
    });
  }

  /**
  * 根据task_no初始化任务依赖关系
  * @param task_info 任务卡信息
  * @returns
  */
  initDependencyInfo(task_info: TaskInfo[]): void {
    if (task_info.length <= 1) {
      return;
    }
    const arr: DependencyInfoList[] = [];
    task_info.forEach(info => {
      if (info.seq === '1') {
        arr.push({ data: [info.task_no] });
      } else {
        arr[arr.length - 1].data.push(info.task_no);
      }
    });
    this.dependencyInfo = arr;
  }

  /**
* 关闭人力资源负荷
* @param event
*/
  changeMaskStatus(event): void {
    this.wbsService.showHRLoad = event;
  }

  toFullScreen(): void {
    this.wbsService.fullScreenStatus = !this.wbsService.fullScreenStatus;
    this.changeRef.markForCheck();
  }

  changeTemp(): void {
    this.getTaskInfo();
    this.getCriticalPath();
    this.getDependencyInfo();
  }

  getProjectStatustypeNo(): boolean {
    return this.wbsService.projectInfo?.project_status === '10' && !this.wbsService.projectInfo?.project_type_no;
  }

  // 项目已启动，任务比重校验不通过，屏蔽按钮功能
  getTaskProportionCheck(): boolean {
    // 存在一级任务的任务比重<100% ==> 整个计划维护页面禁用WBS的删除功能、添加子项功能、新建一级计划
    if ((Number(this.wbsService.projectInfo?.project_status) > 20) && (this.source === Entry.card)) {
      return this.wbsService.pageDatas.find(element => element.task_proportion < 1) !== undefined;
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
        children.children.forEach(v => {
          this.getUpperTask(v, array, flag);
        });
      }
    }
  }

  // 项目已启动，检查各一级任务的整棵树下，是否存在任务比重<100%，禁用整棵树的删除功能、添加子项功能、增加下阶任务(+)
  hasTaskProportionCheck(data): boolean {
    let taskNos: Set<string> = new Set();
    if ((Number(this.wbsService.projectInfo?.project_status) > 20) && (this.source === Entry.card)) {
      // + 检查各一级任务的整棵树下，是否存在任务比重<100%
      let array: Array<string> = [];
      this.wbsService.pageDatas.forEach(element => {
        const arr: Array<string> = [];
        const flag: Array<string> = [];
        this.getUpperTask(element, arr, flag);
        if (flag[0]) {
          array = [...array, ...arr];
        }
      });
      taskNos = new Set([...array].filter(v => v !== ''));
    }
    return taskNos.has(data.task_no);
  }

  export_data(): void {
    this.ganttComponent.export_data();
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
}
