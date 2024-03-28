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
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicUserBehaviorCommService,
} from '@ng-dynamic-forms/core';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DynamicCooperationTaskModel } from '../../../../../model/cooperation-task/cooperation-task.model';
import { DwUserService } from '@webdpt/framework/user';
import { CommonService, Entry } from '../../../../../service/common.service';
import { DragDropService } from '../../../../../directive/dragdrop/dragdrop.service';
import { OnDestroy } from '@angular/core';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';
import { AddSubProjectCardService } from '../../../../../component/add-subproject-card/add-subproject-card.service';
import { DynamicWbsService } from '../../../../../component/wbs/wbs.service';
import { map } from 'rxjs/operators';
import { CooperationTaskService } from '../../cooperation-task.service';


@Component({
  selector: 'app-dynamic-task-wbs-list',
  templateUrl: './task-wbs-list.component.html',
  styleUrls: ['./task-wbs-list.component.less'],
  providers: [CooperationTaskService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicTaskWbsListComponent
  extends DynamicFormControlComponent
  implements OnInit, OnDestroy {
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
  Entry = Entry
  // 项目信息
  projectInfo: any;
  // 甬道内的所有子卡，方便把嵌套结构转化为平铺计算一级卡片的状态
  corridorChildrens: Array<any>;

  datasLength: number = 0;
  // 控制一级计划新增
  // firstPlanSwitch: boolean = false;
  isLoading: boolean = false;
  hasClickSubmit: boolean = false;

  taskMemberInfo: any[] = [];
  pageDatas: any[] = [];
  subscription: Subscription = new Subscription();
  taskInfo: any;


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
    public cooperationTaskService: CooperationTaskService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.removeSessionStorage();
    this.removeListeners();
  }
  private removeSessionStorage(): void {
    sessionStorage.removeItem('hasEditFromProjectNo');
    sessionStorage.removeItem('hasEditFromTaskNoArr');
  }

  get isApproveStatus() {
    return this.wbsService.projectInfo.approve_status === 'N';
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

  ngOnInit(): void {
    this.removeSessionStorage();
    this.commonService.content = this.model.content;
    // spring 3.2 更换api名称 [入参、出参]：'teamwork.task.plan.info.get' ==> 'bm.pisc.assist.schedule.get'
    // 配合标准前端修改
    const bpmData = this.model?.content?.executeContext?.taskWithBacklogData?.bpmData;
    if (!this.wbsService.project_no) {
      this.wbsService.project_no = bpmData?.assist_schedule_info
        ? bpmData?.assist_schedule_info[0]?.project_no : bpmData?.task_info[0]?.project_no;
    }
    this.taskInfo = bpmData?.assist_schedule_info ? bpmData.assist_schedule_info[0] : bpmData?.task_info[0] ?? {};
    this.getProjectInfo();
    this.getWbsAllData();
    this.monitorAddTaskInfo();
    this.monitorTaskInfoGet();
    this.wbsService.pageChange.subscribe((res) => {
      this.getWbsAllData();
    });
  }


  /**
   * 获取项目信息
   */
  getProjectInfo(): void {
    this.cooperationTaskService.getProjectInfo(this.wbsService.project_no).then(async (res: any): Promise<any> => {
      this.wbsService.projectInfo = res;
      if (this.wbsService.projectInfo?.approve_status === 'N') {
        this.wbsService.editable = false;
      }
      this.getProjectIdForQueryApprove();
      this.projectInfo = res;
      const { data } = await this.wbsService.getInfoCheck(this.wbsService.project_no).toPromise();
      this.wbsService.needRefresh = data.check_result;
      this.changeRef.markForCheck();
    });
  }

  getProjectIdForQueryApprove(): void {
    if (this.wbsService.projectInfo.approve_status !== 'N') {
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
          }
        }
      ],
      taskStates: [1, 2, 3, 4, 5],
      activityStates: [1, 2, 3, 4, 5, 6],
    };
    this.wbsService.queryProjectId(params).subscribe((res: any) => {
      const subTasksItem = res.data[0]?.subTasks?.find((el) => {
        return el.state === 1 && el.tmpId === 'projectCenterConsoleStopProject_userProject';
      });
      subTasksItem?.activities?.forEach(element => {
        if (element.actTmpId === 'pccStopProjectApprove') {
          this.wbsService.projectInfo.projectId = element.actId;
          console.log(this.wbsService.projectInfo.projectId);
        }
      });
    });
  }

  /**
   * 获取wbs的数据
   */
  getWbsAllData(): void {
    const params = {
      project_info: [
        {
          control_mode: '1',
          project_no: this.wbsService.project_no,
        },
      ],
    };
    this.commonService.getInvData('task.info.get', params).subscribe((res: any): void => {
      res.data.project_info.forEach((task: any): void => {
        task.disabled = true;
      });
      this.wbsService.allTaskCardList = res.data.project_info;
      const wbsDatas = this.transformData(JSON.parse(JSON.stringify(res.data.project_info)));
      this.wbsService.pageDatasTask = this.wbsService.pageDatas = wbsDatas;
      this.getPlanListInfo(wbsDatas);
      this.datasLength = res.data.project_info?.length;
      this.changeRef.markForCheck();
    });
  }

  monitorTaskInfoGet(): void {
    this.subscription.add(
      this.wbsService.$useTaskTemplateStatus.subscribe((res: any) => {
        if (res === true) {
          this.getWbsAllData();
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
        }
      })
    );
  }


  teamworkTaskPlanUpdate(): void {
    this.cooperationTaskService.getProjectInfo(this.wbsService.project_no).then(async (res: any): Promise<any> => {
      this.wbsService.projectInfo = res;
      this.changeRef.markForCheck();
      if (this.wbsService.projectInfo?.approve_status === 'N') {
        this.wbsService.editable = false;
        this.messageService.error(this.translateService.instant('dj-pcc-签核中不能提交'));
        return;
      }
      this.isLoading = true;
      // 涉及场景：2.协同排定任务提交，入参：项目编号、任务编号=当前协同排定的一级计划任务编号、协助排定计划序号、计划排定状态=2.已完成
      const params = {
        assist_schedule_info: [
          {
            project_no: this.wbsService.project_no,
            task_no: this.taskInfo?.task_no,
            assist_schedule_seq: this.taskInfo?.assist_schedule_seq ?? this.taskInfo?.teamwork_plan_seq, // 协助排定计划序号
            schedule_status: '2' // 计划排定状态 1.正在进行中；2.已完成
          },
        ],
      };
      console.log('开始调用update');
      // spring 3.2 更换api名称 [入参、出参]：'teamwork.task.plan.info.update' ==> 'bm.pisc.assist.schedule.update'
      this.commonService
        .getInvData('bm.pisc.assist.schedule.update', params)
        .subscribe((resp: any): void => {
          console.log('调用update成功');
          this.wbsService.editable = false;
          this.isLoading = false;
          this.hasClickSubmit = true;
          this.messageService.success(this.translateService.instant('default-pcc-提交成功！'));
          this.commonService.pushDTDProcess(this.wbsService.project_no);
          this.changeRef.markForCheck();
        });
    });
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
    this.commonService.submit(submit_params).subscribe((res: any): void => { });
  }

  /**
   * 依据项目编号、任务编号等，取得协同合作任务计划信息 (敏态)
   */
  getPlanListInfo(infoData: any): void {
    const list = [];
    // 配合标准前端修改
    const bpmData = this.model?.content?.executeContext?.taskWithBacklogData?.bpmData;
    const taskInfo = bpmData?.assist_schedule_info ? bpmData?.assist_schedule_info : bpmData?.task_info;
    // [协同计划排定]卡展示任务卡详情，入参：项目编号、任务编号=当前协同排定的一级计划任务编号、协助排定计划序号
    taskInfo.forEach((item: any): void => {
      item.project_no = this.taskInfo?.project_no;
      item.task_no = this.taskInfo?.task_no;
      item.assist_schedule_seq = this.taskInfo?.assist_schedule_seq
        ? this.taskInfo?.assist_schedule_seq : this.taskInfo?.teamwork_plan_seq; // 协助排定计划序号
      item.schedule_status = '1'; // 计划排定状态
    });
    const params = {
      assist_schedule_info: taskInfo
    };
    // spring 3.2 更换api名称 [入参、出参]：'teamwork.task.plan.info.get' ==> 'bm.pisc.assist.schedule.get'
    this.commonService
      .getInvData('bm.pisc.assist.schedule.get', params)
      .subscribe((res: any): void => {
        const taskInfoList = res?.data?.assist_schedule_info;
        let leader_code = '';
        taskInfoList.forEach((listItem: any): void => {
          infoData.forEach((infoItem: any) => {
            if (listItem.task_no === infoItem.task_no) {
              this.wbsService.hasCollaborationCard = true;
              infoItem.isCollaborationCard = true;
              if (infoItem.task_no === infoItem.upper_level_task_no) {
                leader_code = infoItem.liable_person_code;
              }
              list.push(infoItem);
            }
          });
        });
        this.pageDatas = list;
        this.isEditable(leader_code);
        this.changeRef.markForCheck();
      });
  }

  /**
   * 判断任务卡是否可编辑
   * @param leader_code
   */
  isEditable(leader_code: string): void {
    const performerId = this.dynamicUserBehaviorCommService.commData?.workContent?.performerId ?? 'wfgp001';
    forkJoin([
      this.commonService.searchUserInfo({ userId: this.userService.getUser('userId') }),
      this.commonService.getAgentInfo({ userId: performerId })
    ])
      .pipe(map((responses): any => responses.map((item): any => item.data)), takeUntil(this.destroy$))
      .subscribe(
        (value) => {
          if (value[0].id === value[1].agentId && this.pageDatas.length) {
            this.wbsService.editable = true;
            return;
          };
          this.wbsService.editable = value[0].id === leader_code && this.pageDatas.length ? true : false;
          if (this.wbsService.projectInfo?.approve_status === 'N') {
            this.wbsService.editable = false;
          }
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
