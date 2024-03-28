import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicUserBehaviorCommService,
} from '@athena/dynamic-core';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DynamicCooperationTaskModel } from '../../../../../model/cooperation-task/cooperation-task.model';
import { DwUserService } from '@webdpt/framework/user';
import { CommonService, Entry } from '../../../../../service/common.service';
import { DragDropService } from '../../../../../directive/dragdrop/dragdrop.service';
import { OnDestroy } from '@angular/core';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { OpenWindowService } from '@athena/dynamic-ui';
import { AddSubProjectCardService } from '../../../../../component/add-subproject-card/add-subproject-card.service';
import { DynamicWbsService } from '../../../../../component/wbs/wbs.service';
import { map } from 'rxjs/operators';
import { CooperationTaskService } from '../../cooperation-task.service';
import { TaskWbsListService } from './task-wbs-list.service';

@Component({
  selector: 'app-dynamic-task-wbs-list',
  templateUrl: './task-wbs-list.component.html',
  styleUrls: ['./task-wbs-list.component.less'],
  providers: [CooperationTaskService, TaskWbsListService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicTaskWbsListComponent
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
  @Output() changeWbsTaskProportion = new EventEmitter<any>();
  public destroy$ = new Subject<void>();

  // wbs入口
  Entry = Entry;
  // 项目信息
  projectInfo: any;
  // 甬道内的所有子卡，方便把嵌套结构转化为平铺计算一级卡片的状态
  corridorChildrens: Array<any>;

  // 控制一级计划新增
  // firstPlanSwitch: boolean = false;
  isLoading: boolean = false;
  canClickSubmit: boolean = true;

  taskMemberInfo: any[] = [];
  pageDatas: any[] = [];
  subscription: Subscription = new Subscription();
  taskInfo: any;
  canSubmit = true;

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public wbsService: DynamicWbsService,
    private translateService: TranslateService,
    public addSubProjectCardService: AddSubProjectCardService,
    public commonService: CommonService,
    private messageService: NzMessageService,
    private userService: DwUserService,
    protected dragDropService: DragDropService,
    public openWindowService: OpenWindowService,
    public fb: FormBuilder,
    private dynamicUserBehaviorCommService: DynamicUserBehaviorCommService,
    public cooperationTaskService: CooperationTaskService,
    public taskWbsListService: TaskWbsListService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.removeSessionStorage();
    this.removeListeners();
  }
  private removeSessionStorage(): void {
    sessionStorage.removeItem('hasEditFromTaskNoArr' + this.wbsService.project_no);
  }

  get isApproveStatus() {
    return this.wbsService.projectInfo?.approve_status === 'N';
  }

  get getShowAddIcon() {
    return this.wbsService.projectInfo?.project_status !== '10';
  }

  private removeListeners(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  async ngOnInit(): Promise<void> {
    this.addSubProjectCardService.getDateCheck();
    this.removeSessionStorage();
    this.commonService.content = this.model.content;
    const bpmData = this.model?.content?.executeContext?.taskWithBacklogData?.bpmData;
    if (!this.wbsService.project_no) {
      this.wbsService.project_no = bpmData?.assist_schedule_info
        ? bpmData?.assist_schedule_info[0]?.project_no
        : bpmData?.task_info[0]?.project_no;
    }
    this.taskInfo = bpmData?.assist_schedule_info
      ? bpmData.assist_schedule_info[0]
      : bpmData?.task_info[0] ?? {};
    this.getProjectInfo();
    this.getAssistTaskDetailInfo();
    this.monitorAddTaskInfo();
    this.monitorTaskInfoGet();
    this.wbsService.pageChange.subscribe((res) => {
      this.getAssistTaskDetailInfo();
    });
    this.queryChargePersonList();
  }

  getPropertyColor() {
    let color = '34,163,86';
    if (this.projectInfo?.project_property === '10') {
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
    const status = this.projectInfo?.project_status;
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

  /**
   * 获取EOC(鼎捷云端端组织)符合授权及用户关联之员工信息 (敏态)
   */
  queryChargePersonList(): void {
    const params = { project_member_info: [{ project_no: this.wbsService.project_no }] };
    this.commonService.getInvData('employee.info.process', params).subscribe((res: any): void => {
      this.taskWbsListService.personList = res.data.project_member_info;
      this.changeRef.markForCheck();
    });
  }

  /**
   * 获取项目信息
   */
  getProjectInfo(): void {
    this.cooperationTaskService
      .getProjectInfo(this.wbsService.project_no)
      .then(async (res: any): Promise<any> => {
        this.wbsService.projectInfo = res;
        this.getProjectIdForQueryApprove();
        this.projectInfo = res;
        const { data } = await this.wbsService.getInfoCheck(this.wbsService.project_no).toPromise();
        this.wbsService.needRefresh = data.check_result;
        this.changeRef.markForCheck();
      });
  }

  /**
   * 获取所有协同任务卡信息
   */
  async getAssistTaskDetailInfo(): Promise<void> {
    const assist_task_detail_info = await this.taskWbsListService.getAssistTaskDetailInfo();
    if (assist_task_detail_info?.length) {
      this.canClickSubmit = assist_task_detail_info[0].schedule_status === '1' ? true : false;
      const infoData = this.transformData(JSON.parse(JSON.stringify(assist_task_detail_info)));
      infoData[0].isCollaborationCard = true;
      infoData[0].isRootTaskCard = true;
      this.taskWbsListService.root_task_card.root_task_no = infoData[0].task_no;
      this.taskWbsListService.root_task_card.schedule_status = infoData[0].schedule_status;
      this.pageDatas = this.wbsService.pageDatasTask = this.wbsService.pageDatas = infoData;
      this.isEditable(infoData[0]?.responsible_person_no);
      this.changeRef.markForCheck();
    }
  }

  /**
   * 获取查询签核进程的项目卡ID
   * @returns
   */
  getProjectIdForQueryApprove(): void {
    if (this.wbsService.projectInfo?.approve_status !== 'N') {
      return;
    }

    const params = {
      eocId: {},
      tenantId: this.userService.getUser('tenantId'),
      bkInfo: [
        {
          entityName: 'project_d',
          bk: {
            project_no: this.wbsService.projectInfo.project_no,
          },
        },
      ],
      taskStates: [1, 2, 3, 4, 5],
      activityStates: [1, 2, 3, 4, 5, 6],
    };
    this.wbsService.queryProjectId(params).subscribe((res: any) => {
      const subTasksItem = res.data[0]?.subTasks?.find((el) => {
        return el.state === 1 && el.tmpId === 'projectCenterConsoleStopProject_userProject';
      });
      subTasksItem?.activities?.forEach((element) => {
        if (element.actTmpId === 'pccStopProjectApprove') {
          this.wbsService.projectInfo.projectId = element.actId;
          console.log(this.wbsService.projectInfo.projectId);
        }
      });
    });
  }

  monitorTaskInfoGet(): void {
    this.subscription.add(
      this.wbsService.$useTaskTemplateStatus.subscribe((res: any) => {
        if (res === true) {
          this.getAssistTaskDetailInfo();
        }
      })
    );
  }

  monitorAddTaskInfo(): void {
    this.subscription.add(
      this.wbsService.$newCardInfo.subscribe((card: any) => {
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
        }
      })
    );
  }

  /**
   * 点击提交：更新协同任务卡信息
   */
  async teamworkTaskPlanUpdate(): Promise<void> {
    let assist_schedule_info;
    if (!this.canSubmit) {
      return;
    }
    this.canSubmit = false;
    try {
      // 代理卡片，则不做权限管控
      // await this.wbsService.setCollaborateAgentIdSameUserId();
      if (!this.wbsService.collaborateAgentIdSameUserId) {
        // 校验当前点击提交的登录员工必须是当前协同排定的一级计划的负责人
        const root_task_no = this.taskWbsListService.root_task_card?.root_task_no;
        const rootTaskInfo = await this.taskWbsListService.getRootTaskInfo(root_task_no);
        if (!rootTaskInfo.isCollaboratePlanOwner) {
          throw new Error(this.translateService.instant('dj-pcc-非负责人'));
        }
        // 校验项目卡是否是签核中
        const isProjectCardInApproval = await this.taskWbsListService.isProjectCardInApproval();
        if (isProjectCardInApproval) {
          this.canSubmit = true;
          throw new Error(this.translateService.instant('dj-pcc-签核中不能提交'));
        }
      }
      // 开始提交显示Loading
      this.isLoading = true;

      // 协同排定任务提交
      assist_schedule_info = await this.taskWbsListService.submitCollaborateTask(
        this.taskWbsListService.root_task_card.root_task_no
      );
      this.canClickSubmit = assist_schedule_info?.schedule_status === '1' ? true : false;
      this.canSubmit = this.canClickSubmit;
      this.wbsService.editable = assist_schedule_info?.schedule_status === '1' ? true : false;
      if (assist_schedule_info?.error_msg) {
        this.pushDTDProcess(assist_schedule_info);
        throw new Error(assist_schedule_info?.error_msg);
      }
      this.messageService.success(this.translateService.instant('default-pcc-提交成功！'));
      this.pushDTDProcess(assist_schedule_info);
    } catch (error) {
      this.messageService.error(error.message);
    } finally {
      this.isLoading = false;
      this.canSubmit = true;
      this.changeRef.markForCheck();
    }
  }

  /**
   * 调用流程
   * @param assist_schedule_info 协同排定任务回参信息
   */
  pushDTDProcess(assist_schedule_info: any): void {
    if (assist_schedule_info?.schedule_status !== '1') {
      this.commonService.pushDTDProcess(this.wbsService.project_no, [assist_schedule_info]);
    }
  }

  oldsubmit(): void {
    const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
    const processSerialNumber =
      this.model.content?.executeContext?.taskWithBacklogData?.processSerialNumber;
    const workItem =
      this.model.content?.executeContext?.taskWithBacklogData?.backlog[0]?.workitemList[0] ?? {};
    const { workitemId, performerId } = workItem;
    const submit_params = {
      processSerialNumber,
      comment: '',
      locale: DwUserInfo.acceptLanguage,
      performerId,
      workitemId,
    };
    this.commonService.submit(submit_params).subscribe((res: any): void => {});
  }

  /**
   * 判断任务卡是否可编辑
   * @param leader_code
   */
  isEditable(leader_code: string): void {
    const performerId =
      this.dynamicUserBehaviorCommService.commData?.workContent?.performerId ?? 'wfgp001';
    forkJoin([
      this.commonService.searchUserInfo({ userId: this.userService.getUser('userId') }),
      this.commonService.getAgentInfo({ userId: performerId }),
    ])
      .pipe(
        map((responses): any => responses.map((item): any => item.data)),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        this.wbsService.userInfo = value[0];
        if (value[0].id === value[1].agentId && this.pageDatas.length) {
          this.wbsService.editable = true;
          this.wbsService.collaborateAgentIdSameUserId = true;
          return;
        }
        this.wbsService.collaborateAgentIdSameUserId = false;
        this.wbsService.editable = Boolean(value[0].id === leader_code && this.pageDatas.length);
        this.changeRef.markForCheck();
      });
  }
  transformData(list) {
    const record = {};
    const length = list.length;
    const data = [];
    for (let i = 0; i < length; i++) {
      const item = list[i];
      // task_status转数字处理
      item.task_status = Number(item.task_status);
      item.complete_rate = Math.floor(item.complete_rate * 100);
      if (item.sequence) {
        item.sequence = Number(item.sequence);
      }
      // 默认展开所有节点
      item.isChildrenshow = true;
      // 默认收起操作列表
      item.isOperationsShow = false;
      item.children = [];
      // item.switch = false; // 添加子项
      record[item.task_no] = item;
    }

    for (let i = 0; i < length; i++) {
      const item = list[i];
      if (
        item.upper_level_task_no &&
        record[item.upper_level_task_no] &&
        item.upper_level_task_no !== item.task_no
      ) {
        record[item.upper_level_task_no].children.push(item);
      } else {
        if (item.is_issue_task_card) {
          item.disabled = true;
          this.addCardStatus(item);
        }
        data.push(item);
      }
    }
    this.wbsService.cardLevelHandle(data, 0);
    this.filterBySequence(data);
    this.wbsService.calculationChildrenLength(data);
    return data;
  }

  addCardStatus(current: any): void {
    if (current?.children?.length) {
      current.children.forEach((item: any): void => {
        item.disabled = true;
        if (item.children?.length) {
          this.addCardStatus(item.children);
        }
      });
    }
  }

  sortBySequence(a, b): any {
    return a.sequence - b.sequence;
  }

  filterBySequence(data: any): void {
    data.sort(this.sortBySequence);
    data.forEach((item: any, index: any): void => {
      if (item.children?.length) {
        this.filterBySequence(item.children);
      }
    });
  }

  /**
   * 数据平铺， 判断甬道内的第一张卡片的状态
   * @param children 甬道内的第一个children
   * @returns
   */
  treeToArray(children): any {
    children.map((item) => {
      this.corridorChildrens = this.corridorChildrens.concat(item);
      if (item?.children?.length) {
        this.treeToArray(item.children);
      }
    });
    return this.corridorChildrens;
  }

  /**
   * 进行中时判断当前卡片是否逾期&&根据子卡判断上层父卡的状态
   * @param children
   */
  isOverdue(item) {
    item.children.forEach((child) => {
      if (child.task_status === 20 || child.task_status === 10 || child.task_status === 30) {
        if (this.wbsService.overdueDays(child)) {
          child.isOverdue = item.isOverdue = true;
        }
        if (child?.children?.length) {
          this.isOverdue(child);
        }
      }
    });
  }

  /**
   * 点击空白处关闭操作
   */
  closeOperation(data) {
    data.forEach((item) => {
      item.isOperationsShow = item.isOperationsShow ? false : true;
      if (item?.children?.length) {
        this.closeOperation(item.children);
      }
    });
  }

  findParentCard(cardList, card) {
    if (!card.upper_level_task_no) {
      card.level = 0;
      card.children = [];
      cardList.push(card);
      return;
    }
    cardList.forEach((item) => {
      if (item.task_no === card.upper_level_task_no) {
        card.level = item.level + 1;
        item.children.push(card);
        this.changeRef.markForCheck();
      } else {
        if (item.children && item.children.length) {
          this.findParentCard(item.children, card);
        }
      }
    });
  }

  deleteCardInTree(root, currentCard) {
    for (let i = 0; i < root.children.length; i++) {
      const item = root.children[i];
      if (item.task_no === currentCard.task_no) {
        root.children.splice(i, 1);
        break;
      } else {
        if (item.children && item.children.length) {
          this.deleteCardInTree(item, currentCard);
        }
      }
    }
  }

  getEditTaskCardInfo(card: any): void {
    card.children = card?.children ? card.children : [];
    const { currentCardInfo } = this.addSubProjectCardService;
    if (currentCardInfo) {
      const corridorData = this.wbsService.getCurrentCorridor(card);
      if (currentCardInfo['upper_level_task_no'] === card.upper_level_task_no) {
        Object.assign(currentCardInfo, card);
      } else {
        this.deleteCardInTree(corridorData, currentCardInfo);
        this.findParentCard(this.wbsService.pageDatas, card);
      }
    }
  }

  getAddTaskCardInfo(card: any, isFirstPlan?: boolean): void {
    card.isChildrenshow = true;
    card.isOperationsShow = false;
    card.children = [];
    this.findParentCard(this.wbsService.pageDatas, card);
  }

  switchProjectStatus(status) {
    switch (status) {
      case '10':
        return this.translateService.instant('dj-default-未开始');
      case '30':
        return this.translateService.instant('dj-default-进行中');
      case '40':
        return this.translateService.instant('dj-default-已结案');
      case '50':
        return this.translateService.instant('dj-default-暂停');
      case '60':
        return this.translateService.instant('dj-default-指定结案');
      case '20':
        return this.translateService.instant('dj-c-签核中');
    }
  }

  // 处理里层task_member_info
  formatMember(item: any): { project_no: any; task_no: any; executor_no: string }[] {
    const { task_member_info = [] } = item;
    if (task_member_info.length > 0) {
      return task_member_info.map((d) => {
        return {
          ...d,
          task_no: item.task_no,
        };
      });
    } else {
      return [
        {
          project_no: this.wbsService.project_no,
          task_no: item.task_no || '',
          executor_no: '',
        },
      ];
    }
  }

  // 获取task_member_info
  getTaskMemberInfo(list: any): void {
    if (list && list.length) {
      list.forEach((item: any): void => {
        const everyTaskInfo = {
          project_no: this.wbsService.project_no,
          task_no: item.task_no,
          task_name: item.task_name,
          upper_level_task_no: item.upper_level_task_no,
          is_milepost: item.is_milepost,
          milepost_desc: item.milepost_desc,
          workload_qty: item.workload_qty,
          plan_start_date: item.plan_start_date,
          plan_finish_date: item.plan_finish_date,
          liable_person_code: item.liable_person_code,
          remarks: item.remarks,
          is_attachment: item.is_attachment,
          is_approve: item.is_approve,
          sequence: item.sequence,
          eoc_company_id: item.eoc_company_id,
          eoc_site_id: item.eoc_site_id,
          eoc_region_id: item.eoc_region_id,
          workload_unit: item.workload_unit,
          task_dependency_info: item.task_dependency_info || [],
          ar_stage_no: item.ar_stage_no || '',
          ar_stage_name: item.ar_stage_name || '',
          task_member_info: this.formatMember(item),
          task_template_no: item.task_template_no,
          task_template_name: item.task_template_name,
          attachment_remark: item.attachment_remark,
          plan_work_hours: item.plan_work_hours,
        };
        this.taskMemberInfo.push(everyTaskInfo);
        if (item.children && item.children.length) {
          this.getTaskMemberInfo(item.children);
        }
      });
    }
  }

  changeMaskStatus(event) {
    this.wbsService.showHRLoad = event;
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }

  changeWbsTaskCardProportion(event: any) {
    this.changeWbsTaskProportion.emit();
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
}
