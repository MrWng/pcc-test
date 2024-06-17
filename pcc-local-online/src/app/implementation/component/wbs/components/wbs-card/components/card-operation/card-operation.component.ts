import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewRef,
} from '@angular/core';
import { AthMessageService } from '@athena/design-ui';
import { DynamicUserBehaviorCommService } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { ButtonType } from 'app/implementation/component/add-subproject-card/add-subproject-card.interface';
import { AddSubProjectCardService } from 'app/implementation/component/add-subproject-card/add-subproject-card.service';
import { ProjectPlanCardService } from 'app/implementation/component/project-plan-card/project-plan-card.service';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
// eslint-disable-next-line max-len
import { TaskWbsListService } from 'app/implementation/programs/task-detail/cooperation-task/components/task-wbs-list/task-wbs-list.service';
import { APIService } from 'app/implementation/service/api.service';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { WbsCardService } from '../../wbs-card.service';
import { CancelCollaborationComponent } from 'app/implementation/component/cancel-collaboration/cancel-collaboration.component';
@Component({
  selector: 'app-card-operation',
  templateUrl: './card-operation.component.html',
  styleUrls: ['./card-operation.component.less'],
  providers: [ProjectPlanCardService],
})
export class CardOperationComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() cardInfo: any;
  @Input() sourceRealy = '';
  @Input() hasAuth: boolean = true;
  @Input() source: Entry = Entry.card;
  @Input() signOff: boolean = false;
  @Input() taskChildrenNos: any = [];
  @Input() root_task_card = {
    // 协同一级计划任务卡信息
    root_task_no: '', // 根任务卡编号
    schedule_status: '', // 协助计划排定状态
    assist_schedule_seq: '', // 协助排定计划序号
  };
  @Input() showAddIcon: boolean = true;
  // 变更状态
  @Input() change_status: string;
  @Input() nzPopover;
  // 原任务状态
  @Input() old_task_status: string;
  @Input() currentEditingCard: any;
  @Input() currentCard: any;
  @Input() inCollaboration: boolean = false;
  @Input() cardLeave = () => {};
  @Input() setPopoverConfig = (config) => {};
  @Input() triggerConfirmDeleteVisible = (flag, currentCard) => {};
  @Input() setPopoverVisible = (e) => {};
  @Input() cardExecutionStatusInfo;
  @Output() previewEmitter = new EventEmitter();
  @ViewChild('operationContainer') operationContainer: ElementRef<HTMLElement>;
  @ViewChild('contentTemplate', { read: TemplateRef }) contentTemplate: TemplateRef<any>;
  @ViewChild('contentContainer', { read: ViewContainerRef }) contentContainer: ViewContainerRef;
  Entry = Entry;
  editCode: string;
  loading: boolean = false;
  mouseenterFlag: boolean = false;
  get editBtnLoading() {
    return this.wbsCardService.cardOperationSpace.editBtnLoading;
  }
  set editBtnLoading(val) {
    this.wbsCardService.cardOperationSpace.editBtnLoading = val;
  }
  get addBtnLoading() {
    return this.wbsCardService.cardOperationSpace.addBtnLoading;
  }
  set addBtnLoading(val) {
    this.wbsCardService.cardOperationSpace.addBtnLoading = val;
  }
  get removeBtnLoading() {
    return this.wbsCardService.cardOperationSpace.removeBtnLoading;
  }
  set removeBtnLoading(val) {
    this.wbsCardService.cardOperationSpace.removeBtnLoading = val;
  }
  get isTrackPages() {
    return this.wbsService.isTrackPages && this.source === Entry.card;
  }
  get canCancelCollaboration() {
    return (
      this.wbsService.projectInfo.curUserId === this.wbsService.projectInfo.project_leader_code &&
      this.cardInfo.isCollaborationCard &&
      this.source === Entry.card &&
      !this.isTrackPages
    );
  }
  operationBtn = [];
  cancelCollaborationConfirmVisible: boolean = false;

  constructor(
    public el: ElementRef,
    public dynamicWbsService: DynamicWbsService,
    public wbsService: DynamicWbsService,
    public addSubProjectCardService: AddSubProjectCardService,
    private translateService: TranslateService,
    private apiService: APIService,
    public commonService: CommonService,
    public changeRef: ChangeDetectorRef,
    private taskWbsListService: TaskWbsListService,
    private athMessageService: AthMessageService,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
    private projectPlanCardService: ProjectPlanCardService,
    private modal: NzModalService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private wbsCardService: WbsCardService
  ) {
    this.editCode =
      'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON002';
  }

  ngOnInit() {}
  ngAfterViewInit() {
    this.initOperationBtn();
  }

  ngOnDestroy() {
    this.cancelCollaborationConfirmLeave();
    this.el.nativeElement.parentNode.removeEventListener(
      'mouseleave',
      this.cancelCollaborationConfirmLeave
    );
  }
  setLoading(flag) {
    this.loading = flag;
    this.changeRef.markForCheck();
  }
  cancelCollaborationConfirmLeave = (e?: any) => {
    if (
      this.cancelCollaborationConfirmVisible &&
      e &&
      document.querySelector('.cancel-collaboration-confirm-wrapper').contains(e.relatedTarget)
    ) {
      return;
    }
    this.setPopoverConfig({
      popoverVisible: false,
      popoverTrigger: 'hover',
      markForCheck: true,
    });
  };
  cancelCollaborationConfirmVisibleChange(e) {
    this.cancelCollaborationConfirmVisible = e;
    this.el.nativeElement.parentNode.removeEventListener(
      'mouseleave',
      this.cancelCollaborationConfirmLeave
    );
    this.el.nativeElement.parentNode.addEventListener(
      'mouseleave',
      this.cancelCollaborationConfirmLeave
    );
    const config = {
      popoverVisible: true,
      popoverTrigger: null,
    };
    this.setPopoverConfig(config);
  }

  initOperationBtn() {
    const self = this;
    this.operationBtn = [
      {
        btnText: this.translatePccWord('新增'),
        hidden: this.isTrackPages,
        handler: this.addSubProjectCard.bind(this),
        get btnLoading() {
          return self.addBtnLoading;
        },
        get disabled() {
          return (
            self.commonService?.content?.finished ||
            !self.hasAuth ||
            !self.addChildConditionAggregation(self.cardInfo) ||
            !self.isHiddenAdd(self.cardInfo)
          );
        },
      },
      {
        btnText: this.translatePccWord('修改'),
        hidden: this.isTrackPages,
        handler: this.edit.bind(this),
        userBehavior: {
          name: this.translateService.instant('dj-default-编辑一级计划'),
          code: this.editCode,
        },
        get btnLoading() {
          return self.editBtnLoading;
        },
        get disabled() {
          return (
            self.commonService?.content?.finished ||
            !self.hasAuth ||
            !self.mainOperateConditionAggregation(self.cardInfo) ||
            !self.cardInfo.canEdit
          );
        },
      },
      {
        btnText: this.translatePccWord(!this.isTrackPages ? '查看' : '查看任务信息'),
        hidden: false,
        handler: this.preview.bind(this),
        get btnLoading() {
          return false;
        },
        get disabled() {
          return false;
        },
      },
      {
        btnText: this.translatePccWord('取消协同'),
        hidden:
          this.isTrackPages ||
          this.wbsService['cancelCollaborationSuccessFlag'] ||
          !this.canCancelCollaboration,
      },
      {
        btnText: this.translatePccWord('删除'),
        hidden: this.isTrackPages,
        handler: this.delete.bind(this),
        get btnLoading() {
          return self.removeBtnLoading;
        },
        get disabled() {
          return (
            self.commonService?.content?.finished ||
            !self.hasAuth ||
            !self.mainOperateConditionAggregation(self.cardInfo) ||
            self.isDisableDeleteButton(self.cardInfo)
          );
        },
      },
    ];
  }
  preview(currentCardInfo) {
    this.previewEmitter.emit(currentCardInfo);
  }
  async edit(currentCardInfo): Promise<any> {
    try {
      this.editBtnLoading = true;
      if (this.source !== Entry.maintain) {
        const checkFlag = await this.editOrDelete(this.cardInfo);
        if (!checkFlag) {
          return;
        }
      }
      // plm项目需要调plm.work.item.status.process接口查询状态用于管控负责人栏位是否禁用，该接口比较慢会造成打开wbs卡片后还未请求返回导致管控失效
      if (
        (!currentCardInfo.canEdit && this.source !== Entry.maintain) ||
        currentCardInfo.plmDisabledEdit
      ) {
        return;
      }
      this.addSubProjectCardService.showAddTaskCard = false;
      currentCardInfo.isOperationsShow = false;
      this.currentEditingCard = currentCardInfo;
      const firstLevelTaskCard = this.wbsService.getCurrentCorridor(currentCardInfo); // 获取每列第一个任务卡
      const title =
        currentCardInfo.level === 0
          ? this.translateService.instant('dj-default-编辑一级计划')
          : this.translateService.instant('dj-default-编辑子项');
      this.setPopoverVisible(false);
      this.addSubProjectCardService.openAddSubProjectCard(
        title,
        ButtonType.EDIT,
        firstLevelTaskCard,
        currentCardInfo,
        this.source
      );
    } catch (error) {
    } finally {
      this.editBtnLoading = false;
      this.changeRef.markForCheck();
    }
  }
  // 三个点的控制条件
  mainOperateConditionAggregation(item): boolean {
    if (this.signOff) {
      return false;
    }
    if (this.source === Entry.projectChange) {
      return true;
    }
    if (
      this.taskChildrenNos &&
      this.taskChildrenNos.length &&
      this.taskChildrenNos.includes(item.task_no) &&
      this.source === Entry.card &&
      item.level !== 0
    ) {
      return false;
    } else {
      if (this.source === Entry.maintain) {
        return true;
      }
      // 协同定制页面
      if (this.source === Entry.collaborate) {
        if (!this.wbsService.editable) {
          return false;
        }
        // 任务的计划排定状态为1.进行中, 不禁用
        if (this?.root_task_card?.schedule_status !== '1') {
          return false;
        }
        // 协同排定计划的一级计划，禁用[...]
        if (item.isRootTaskCard) {
          return false;
        }
        // 任务状态 不是是10.未开始 或 不是20.进行中,禁用[...]
        if (!['10', '20'].includes(item.old_task_status)) {
          return false;
        }
        return true;
      }
      return this.hiddenAdd(item, 1) && this.wbsService.editable && !this.wbsService.needRefresh;
    }
  }
  /**
   *
   * @param item
   * @param type 1: 三个点 2:+号
   * @returns
   */
  hiddenAdd(item, type) {
    let unShow;
    if (type === 2) {
      if (item.children && item.children.length) {
        unShow = item.task_status === 30 ? true : false;
      } else {
        unShow = item.task_status > 10 ? true : false;
      }
    } else {
      unShow = item.task_status > 20 ? true : false;
      item.unDelete = item.task_status > 10 || item.unDelete ? true : false;
      item.someEdit = item.task_status > 10 ? true : false;
      if (this.source === Entry.projectChange) {
        unShow = item.old_task_status > '20' ? true : false;
        item.unDelete = item.old_task_status > '10' || item.unDelete ? true : false;
        item.someEdit = item.old_task_status > '10' ? true : false;
      }
    }
    return !unShow;
  }
  // 判断是否可编辑删除（不用）
  async editOrDelete(item: any, event?: any): Promise<boolean> {
    try {
      // this.cardOperation.setLoading(true);
      if (this.source === Entry.projectChange) {
        const result = await this.wbsService.checkChangeForbidden(item.task_no);
        const { change_status, old_task_status } = result;
        this.change_status = change_status;
        this.old_task_status = old_task_status;
        if (change_status === '1' && ['10', '20'].includes(old_task_status)) {
          await this.getDesignStatus(item);
          const params = {
            excluded_already_deleted_task: true,
            project_change_task_detail_info: [
              {
                project_no: this.wbsService.project_no,
                change_version: this.wbsService.change_version,
                task_no: item.task_no,
              },
            ],
          };
          item.isOperationsShow = false;
          const res = await this.commonService
            .getInvData('bm.pisc.project.change.task.detail.get', params)
            .toPromise();
          this.resetItemDateAndShow(item, res.data?.project_change_task_detail_info[0]);
          this.changeRef.markForCheck();
        }
      } else if (this.source === Entry.collaborate) {
        await this.getDesignStatus(item);
        item.isOperationsShow = false;
        // 代理卡片，则不做权限管控
        // await this.wbsService.setCollaborateAgentIdSameUserId();
        if (!this.wbsService.collaborateAgentIdSameUserId) {
          // 协同定制页面：当前登录员工是当前协同排定的一级计划的负责人才可继续操作
          const rootTaskInfo = await this.taskWbsListService.getRootTaskInfo(
            this.root_task_card?.root_task_no
          );
          if (!rootTaskInfo.isCollaboratePlanOwner) {
            this.athMessageService.error(this.translateService.instant('dj-pcc-非负责人'));
            return;
          }
          // 协同任务卡需要校验根任务协同计划排定状态为进行中才可以编辑
          const assistScheduleInfo = await this.taskWbsListService.getAssistScheduleInfo(
            this.root_task_card?.root_task_no
          );
          if (assistScheduleInfo[0]?.schedule_status !== '1') {
            this.athMessageService.error(this.translateService.instant('dj-pcc-不为进行中'));
            return;
          }
        }
        const assist_task_detail_info = await this.taskWbsListService.getAssistTaskDetailInfo(item);
        this.resetItemDateAndShow(item, assist_task_detail_info[0]);
      } else {
        await this.getDesignStatus(item);
        const params = {
          project_info: [
            {
              control_mode: '1',
              task_property: this.source === Entry.maintain ? '2' : '1',
              project_no: item.project_no,
              task_no: item.task_no,
            },
          ],
        };
        item.isOperationsShow = false;
        const res = await this.commonService.getInvData('task.info.get', params).toPromise();
        if (this.source === Entry.card) {
          const check_type = ['1', '2', '4', '5'];
          if (item.task_no !== item.upper_level_task_no) {
            check_type.push('3');
          }
          const resChange = await this.commonService
            .getProjectChangeStatus(item.project_no, check_type, '1', item.task_no)
            .toPromise();
          this.resetItemDateAndShow(item, res.data?.project_info[0]);
          this.changeRef.markForCheck();
        } else {
          this.resetItemDateAndShow(item, res.data?.project_info[0]);
          this.changeRef.markForCheck();
        }
      }
      return true;
    } catch (error) {
      return false;
    } finally {
      // this.cardOperation.setLoading(false);
    }
  }
  /**
   * 控制负责人是否禁用：取得plm工作项数组后，判断是否全部为未启动，如果全部未启动，则禁用负责人
   */
  getDesignStatus(currentCardInfo) {
    const { task_status, task_category, project_no, task_no } = currentCardInfo;
    if ((task_status === 20 || task_status === '20') && task_category === 'PLM') {
      currentCardInfo['plmDisabledEdit'] = true;
      return this.apiService
        .work_Item_Data_Get([{ project_no: project_no, task_no: task_no }])
        .then((plmResult) => {
          // 若PLM状态（其中一笔） = 已完成（completed），子项开窗所有栏位只读
          const completed =
            plmResult.filter((item) => item.design_status === 'completed').length > 0
              ? 'completed'
              : '';
          let notStart = '';
          if (!completed) {
            // 若PLM状态（多笔）全部 = 未启动（notStart） 则负责人、执行人可删除/新增；否则只能新增执行人，负责人不可修改
            notStart =
              plmResult.filter((item) => item.design_status === 'notStart').length ===
              plmResult.length
                ? 'notStart'
                : '';
          }
          currentCardInfo['designStatus'] = completed ? completed : notStart;
          currentCardInfo['plmDisabledEdit'] = false;
        });
    }
    return Promise.resolve();
  }
  resetItemDateAndShow(item, data): void {
    item.task_dependency_info = data?.task_dependency_info;
    item.assist_task_dependency_info = data?.assist_task_dependency_info; // 协同排定任务依赖关系信息
    item.is_issue_task_card = data?.is_issue_task_card;
    item.attachment = data?.attachment;
    item.task_status =
      this.source === Entry.collaborate ? data?.old_task_status : data?.task_status;
    item.old_task_status = data?.old_task_status;
    // 协同定制页面：编辑按钮可用条件：(原任务状态是10.未开始或20.进行中)
    if (this.source === Entry.collaborate) {
      item.canEdit = ['10', '20'].includes(data.old_task_status);
    } else if (this.source === Entry.projectChange) {
      // 项目变更状态是1.进行中 且 任务状态是10.未开始或20.进行中
      item.canEdit = ['10', '20'].includes(this.old_task_status) && this.change_status === '1';
    } else {
      const task_status = Number(data.task_status);
      item.canEdit = [10, 20].includes(task_status);
    }
    item.remarks = data?.remarks;
    item.upper_level_task_no = data?.upper_level_task_no;
    if (Number(data?.project_status) > 10) {
      this.wbsService.projectInfo.project_status = data.project_status;
    }
    this.showEditOrDelete(item, event);
    this.changeRef.markForCheck();
  }

  showEditOrDelete(item: any, event: any) {
    this.closeOperation(this.wbsService.pageDatas);
    item.isOperationsShow = !item.isOperationsShow;
    this.changeRef.markForCheck();
    this.changeRef.detectChanges();
  }
  /**
   * 点击空白处关闭操作
   * @param data
   */
  closeOperation(data) {
    data.forEach((item) => {
      item.isOperationsShow = false;

      if (item.children && item.children.length) {
        this.closeOperation(item.children);
      }
    });
  }
  isHiddenAdd(item): boolean {
    let isShowButton = false;
    if (this.source === Entry.projectChange) {
      item.unDelete = item.old_task_status > '10' || item.unDelete ? true : false;
      item.someEdit = item.old_task_status > '10' ? true : false;
      return true;
    }
    if (this.source === Entry.collaborate) {
      isShowButton =
        this.wbsService.editable &&
        this.projectPlanCardService.getAddButtonPermissions(
          item,
          this?.root_task_card?.schedule_status,
          !this.hasTaskProportionCheck(item)
        );
      this.hiddenAdd(item, 1);
    } else {
      const condition1 =
        (this.hiddenAdd(item, 2) && this.wbsService.editable) || this.source === Entry.maintain;
      const condition2 = !this.hasTaskProportionCheck(item);
      if (condition1 && condition2) {
        isShowButton = true;
      } else {
        isShowButton = false;
      }
    }
    return isShowButton;
  }
  // + 的控制条件
  addChildConditionAggregation(item): boolean {
    if (this.signOff) {
      return false;
    }
    if (
      this.taskChildrenNos &&
      this.taskChildrenNos.length &&
      this.taskChildrenNos.includes(item.task_no) &&
      this.source === Entry.card
    ) {
      return false;
    } else {
      if (this.source === Entry.collaborate) {
        return this.showAddIcon;
      }
      return this.showAddIcon && !this.wbsService.needRefresh;
    }
  }
  async delete(card): Promise<any> {
    try {
      this.removeBtnLoading = true;
      if (this.source !== Entry.maintain) {
        const checkFlag = await this.editOrDelete(this.cardInfo);
        if (!checkFlag) {
          return;
        }
      }
      if (this.source === Entry.collaborate) {
        if (card.unDelete) {
          return;
        }
        // 点击‘...’，选择删除，删除可用条件，需要实时调用查询项目状态
        const res = await this.projectPlanCardService.getProjectInfo();
        // 更新项目状态
        this.wbsService.projectInfo.project_status = res.project_status;
        // 项目状态是10.未开始,项目状态是30.进行中才有可能可用
        if (!['10', '30'].includes(this.wbsService.projectInfo.project_status)) {
          this.athMessageService.error(this.translateService.instant('dj-pcc-不可删除'));
          return;
        }
      } else {
        if (card.noEdit || card.unDelete) {
          return;
        }
      }
      if (this.source === Entry.projectChange) {
        if (
          this.change_status !== '1' ||
          this.old_task_status !== '10' ||
          this.hasTaskProportionCheckForPC(card)
        ) {
          return;
        }
      }
      if (this.source !== Entry.maintain) {
        const { data } = await this.wbsService.getInfoCheck(this.wbsService.project_no).toPromise();
        this.wbsService.needRefresh = data.check_result;
      }
      if (this.wbsService.needRefresh && this.source !== Entry.collaborate) {
        this.athMessageService.error(this.wbsService.needRefresh);
        this.wbsService.changeWbs$.next();
        return;
      }
      if (this.getTaskProportionCheck() || this.hasTaskProportionCheck(card)) {
        return;
      }
      this.currentCard = card;
      card.isOperationsShow = false;
      this.triggerConfirmDeleteVisible(true, this.currentCard);
      this.setPopoverVisible(false);
      this.changeRef.markForCheck();
    } catch (error) {
    } finally {
      this.removeBtnLoading = false;
      this.changeRef.markForCheck();
    }
  }
  // 任务卡片，右下角(+) ，添加下级任务卡片
  async addSubProjectCard(currentCardInfo: any, e): Promise<void> {
    try {
      if (e.isDisabled) {
        return;
      }
      this.addBtnLoading = true;
      if (this.source === Entry.projectChange) {
        if (!this.addSubProjectCardService.showAddTaskCard) {
          const result = await this.wbsService.checkChangeForbidden(currentCardInfo.task_no);
          const { change_status, old_task_status } = result;
          this.change_status = change_status;
          this.old_task_status = old_task_status;
        }
        // 变更状态是1.进行中 且 当前任务不存在任务比重<100%的下阶任务 且 (任务状态是10.未开始 或 (任务状态是20.进行中 且 当前任务非尾阶))
        // eslint-disable-next-line max-len
        if (
          this.change_status === '1' &&
          !this.hasTaskProportionCheckForPC(currentCardInfo) &&
          (['10'].includes(this.old_task_status) ||
            (['20'].includes(this.old_task_status) && currentCardInfo.children.length > 0))
        ) {
        } else {
          return;
        }
      }
      // 表单未清空之前，不允许打开
      if (this.addSubProjectCardService.validateForm?.value?.task_name) {
        return;
      }
      if (this.source === Entry.collaborate) {
        // 代理卡片，则不做权限管控
        await this.wbsService.setCollaborateAgentIdSameUserId();
        if (!this.wbsService.collaborateAgentIdSameUserId) {
          // 协同任务卡需要校验当前登录员工必是否是当前协同排定的一级计划的负责人
          const rootTaskInfo = await this.taskWbsListService.getRootTaskInfo(
            this.root_task_card?.root_task_no
          );
          if (!rootTaskInfo.isCollaboratePlanOwner) {
            this.athMessageService.error(this.translateService.instant('dj-pcc-非负责人'));
            return;
          }
          // 协同任务卡需要校验根任务协同计划排定状态为进行中才可以编辑
          const assistScheduleInfo = await this.taskWbsListService.getAssistScheduleInfo(
            this.root_task_card?.root_task_no
          );
          if (assistScheduleInfo[0]?.schedule_status !== '1') {
            this.athMessageService.error(this.translateService.instant('dj-pcc-不为进行中'));
            return;
          }
        }
      }
      const firstLevelTaskCard = this.wbsService.getCurrentCorridor(currentCardInfo);
      const title = this.translateService.instant('dj-default-添加子项');
      if (this.source === Entry.card) {
        await this.commonService
          .getProjectChangeStatus(
            currentCardInfo.project_no,
            ['1', '2', '3', '4', '5'],
            '1',
            currentCardInfo.task_no
          )
          .toPromise();
        this.setPopoverVisible(false);
        this.addSubProjectCardService.openAddSubProjectCard(
          title,
          ButtonType.PLUS,
          firstLevelTaskCard,
          currentCardInfo,
          this.source
        );
        this.addSubProjectCardService.showAddTaskCard = true;
        this.changeRef.markForCheck();
      } else {
        this.setPopoverVisible(false);
        this.addSubProjectCardService.openAddSubProjectCard(
          title,
          ButtonType.PLUS,
          firstLevelTaskCard,
          currentCardInfo,
          this.source
        );
        this.changeRef.markForCheck();
      }
    } catch (error) {
    } finally {
      this.addBtnLoading = false;
      this.changeRef.markForCheck();
    }
  }

  /**
   * 删除按钮是否可用
   * @param item
   * @returns
   */
  isDisableDeleteButton(item) {
    //  协同定制页
    if (this.source === Entry.collaborate) {
      // 项目状态是10.未开始，按钮可用
      item.unDelete = false;
      if (this.wbsService.collaborateAgentIdSameUserId) {
        return false;
      }
      if (this.wbsService.projectInfo.project_status === '10') {
        return false;
      }
      // 项目状态是30.进行中，并且 当前任务不存在任务比重 < 100 % 的下阶任务，并且任务状态 = 10.未开始，按钮可用
      if (
        this.wbsService.projectInfo.project_status === '30' &&
        !this.hasTaskProportionCheck(item) &&
        item.old_task_status === '10'
      ) {
        return false;
      }
      item.unDelete = true;
      return true;
    } else if (this.source === Entry.projectChange) {
      // 项目变更状态是1.进行中 且 当前任务不存在任务比重<100%的下阶任务 且 任务状态是10.未开始
      return !(
        this.change_status === '1' &&
        this.old_task_status === '10' &&
        !this.hasTaskProportionCheckForPC(item)
      );
    } else {
      return (
        item.complete_rate !== 0 ||
        item.isCollaborationCard ||
        item.unDelete ||
        !item.canEdit ||
        this.getTaskProportionCheck() ||
        this.hasTaskProportionCheck(item)
      );
    }
  }
  // 找到每组计划中，下阶任务的任务比重<1的，返回每组计划的任务的task_no
  hasTaskProportionCheck(data): boolean {
    let taskNos: Set<string> = new Set();
    if (
      Number(this.wbsService.projectInfo?.project_status) > 20 &&
      (this.source === Entry.card || this.source === Entry.collaborate)
    ) {
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
  // 找到每组计划中，下阶任务的任务比重<1的，返回每组计划的任务的task_no
  getUpperTask(children, array, flag) {
    if (children) {
      array.push(children.task_no);
      if (children.task_proportion < 1) {
        flag.push(true);
      }
      if (children.children.length) {
        children.children.forEach((v) => {
          this.getUpperTask(v, array, flag);
        });
      }
    }
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

  // 项目已启动，任务比重校验不通过，屏蔽按钮功能
  getTaskProportionCheck(): boolean {
    // 存在一级任务的任务比重<100% ==> 整个计划维护页面禁用WBS的删除功能、添加子项功能、新建一级计划
    if (
      Number(this.wbsService.projectInfo?.project_status) > 20 &&
      (this.source === Entry.card ||
        this.source === Entry.collaborate ||
        this.source === Entry.projectChange)
    ) {
      return this.wbsService.pageDatas.find((element) => element.task_proportion < 1) !== undefined;
    } else {
      return false;
    }
  }
  cancelCollaborationSuccess() {
    // this.wbsService.pageChange.next(true);
  }
  cancelCollaborationFullFail({ inCollaboration, isOk, source }) {
    // if (source !== Entry.collaborate) {
    //   this.wbsService.pageChange.next(true);
    // }
  }
  translatePccWord(val: string): string {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
