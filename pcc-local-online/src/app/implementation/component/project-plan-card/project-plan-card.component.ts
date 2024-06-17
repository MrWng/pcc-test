import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  SkipSelf,
  ViewChild,
} from '@angular/core';
import { DynamicWbsService } from '../wbs/wbs.service';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { DragDropService } from '../../directive/dragdrop/dragdrop.service';
import { DynamicUserBehaviorCommService } from '@athena/dynamic-core';
import { DwUserService } from '@webdpt/framework/user';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';
import { ButtonType } from '../add-subproject-card/add-subproject-card.interface';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { ProjectPlanCardService } from './project-plan-card.service';
import { TaskWbsListService } from '../../programs/task-detail/cooperation-task/components/task-wbs-list/task-wbs-list.service';
import { APIService } from '../../service/api.service';

@Component({
  selector: 'app-project-plan-card',
  templateUrl: './project-plan-card.component.html',
  styleUrls: ['./project-plan-card.component.less'],
  providers: [ProjectPlanCardService, TaskWbsListService],
})

/**
 * 项目计划维护
 */
export class ProjectPlanCardComponent implements OnInit, OnChanges, OnDestroy {
  // wbs入口
  @Input() source: Entry = Entry.card;
  @Input() sourceRealy = '';
  @Input() planCardList: any;
  @Input() listIndex: number;
  @Input() hasAuth: boolean = true;

  @Input() showStatus: boolean = true;
  @Input() showAddIcon: boolean = true;

  @Input() from: string = '';
  @Input() hasGroundEnd: any; // 交付设计器，是否依赖地端
  @Input() hasT100: boolean = false; // 交付设计器，是否依赖地端
  @Input() root_task_card = {
    // 协同一级计划任务卡信息
    root_task_no: '', // 根任务卡编号
    schedule_status: '', // 协助计划排定状态
    assist_schedule_seq: '', // 协助排定计划序号
  };

  @Input() signOff: boolean = false;

  @Input() taskChildrenNos: any = [];

  // @Input() collaborationTaskNoList: string[] = [];
  @Output() changeWbsTaskCardProportion = new EventEmitter<any>();
  @Output() refreshPageChange: EventEmitter<any> = new EventEmitter();

  @ViewChild('changeReason') changeReason: any;

  // wbs入口
  Entry = Entry;

  planCardData: Array<any>;
  currentEditingCard: any;
  finalList: any[] = [];
  closeList = [];
  cardIsEdit: object = {}; // 是否修改了任务卡片的子项开窗内容
  upper_level_task_no_arr: Set<string> = new Set();
  currentCard: any;
  // 删除任务卡
  confirmDeleteVisible: boolean = false;
  // 是否显示 编辑
  isShowPopover: boolean = false;
  editCode: string;

  // 变更状态
  change_status: string;
  // 原任务状态
  old_task_status: string;
  inCollaboration: boolean = true;
  constructor(
    @SkipSelf()
    public wbsService: DynamicWbsService,
    public addSubProjectCardService: AddSubProjectCardService,
    public changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    private messageService: NzMessageService,
    private userService: DwUserService,
    public wbsTabsService: WbsTabsService,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
    private athMessageService: AthMessageService,
    private projectPlanCardService: ProjectPlanCardService,
    private taskWbsListService: TaskWbsListService,
    private apiService: APIService
  ) {
    this.editCode =
      'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON002';
  }

  isIssueTaskCard(item: object): boolean {
    // 修复：spring 1.8 拖拽功能管控
    // 整棵树存在已下发的任务卡（is_issue_task_card=true）则整棵树不可拖拽，也不可拖拽其它任务至这棵树
    return item !== null && item !== undefined && item['is_issue_task_card'];
  }

  isCollaborationCardNoMove(task_no): boolean {
    const obj = this.wbsService.getParentTree(task_no);
    const condition = obj && obj['isCollaborationCard'] && this.source === Entry.card;
    return condition ? true : false;
  }

  async onDrop(e: DragDropService, target, index) {
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
    if (
      e.dragData.item.disabled ||
      target.disabled ||
      e.dragData.item.task_no === e.dragData.item.upper_level_task_no ||
      !e.dragData.item.upper_level_task_no
    ) {
      return;
    }
    if (
      this.hasT100 &&
      this.hasGroundEnd === 'Y' &&
      this.wbsService.projectInfo?.project_status !== '10'
    ) {
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
    this.changeRef.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges): void {}

  ngOnInit() {}

  dropStartEvent(): void {
    this.isShowPopover = false;
  }

  ngOnDestroy(): void {}

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

  /**
   *
   * @param item 展开/收起子节点
   */
  showOrHideChildren(item: any): void {
    item.isChildrenshow = !item.isChildrenshow;
    const corridorData = this.wbsService.getCurrentCorridor(item);
    this.wbsService.calculationChildrenLength([corridorData]);
    this.changeRef.markForCheck();
  }

  // 判断是否可编辑删除（不用）
  async editOrDelete(item: any, event: any): Promise<void> {
    event.stopPropagation();
    if (this.source === Entry.projectChange) {
      const result = await this.wbsService.checkChangeForbidden(item.task_no);
      const { change_status, old_task_status } = result;
      this.change_status = change_status;
      this.old_task_status = old_task_status;
      if (change_status === '1' && ['10', '20'].includes(old_task_status)) {
        this.getDesignStatus(item);
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
        this.commonService
          .getInvData('bm.pisc.project.change.task.detail.get', params)
          .subscribe((res: any): void => {
            this.resetItemDateAndShow(item, res.data?.project_change_task_detail_info[0]);
            this.changeRef.markForCheck();
          });
      }
    } else if (this.source === Entry.collaborate) {
      this.getDesignStatus(item);
      item.isOperationsShow = false;
      // 代理卡片，则不做权限管控
      // await this.wbsService.setCollaborateAgentIdSameUserId();
      if (!this.wbsService.collaborateAgentIdSameUserId) {
        // 协同定制页面：当前登录员工是当前协同排定的一级计划的负责人才可继续操作
        const rootTaskInfo = await this.taskWbsListService.getRootTaskInfo(
          this.root_task_card?.root_task_no
        );
        if (!rootTaskInfo.isCollaboratePlanOwner) {
          this.messageService.error(this.translateService.instant('dj-pcc-非负责人'));
          return;
        }
        // 协同任务卡需要校验根任务协同计划排定状态为进行中才可以编辑
        const assistScheduleInfo = await this.taskWbsListService.getAssistScheduleInfo(
          this.root_task_card?.root_task_no
        );
        if (assistScheduleInfo[0]?.schedule_status !== '1') {
          this.messageService.error(this.translateService.instant('dj-pcc-不为进行中'));
          return;
        }
      }
      const assist_task_detail_info = await this.taskWbsListService.getAssistTaskDetailInfo(item);
      this.resetItemDateAndShow(item, assist_task_detail_info[0]);
    } else {
      this.getDesignStatus(item);
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
      this.commonService.getInvData('task.info.get', params).subscribe((res: any): void => {
        if (this.source === Entry.card) {
          const check_type = ['1', '2', '4', '5'];
          if (item.task_no !== item.upper_level_task_no) {
            check_type.push('3');
          }
          this.commonService
            .getProjectChangeStatus(item.project_no, check_type, '1', item.task_no)
            .subscribe(
              (resChange: any): void => {
                this.resetItemDateAndShow(item, res.data?.project_info[0]);
                this.changeRef.markForCheck();
              },
              (error) => {}
            );
        } else {
          this.resetItemDateAndShow(item, res.data?.project_info[0]);
          this.changeRef.markForCheck();
        }
      });
    }
  }

  /**
   * 控制负责人是否禁用：取得plm工作项数组后，判断是否全部为未启动，如果全部未启动，则禁用负责人
   */
  getDesignStatus(currentCardInfo) {
    const { task_status, task_category, project_no, task_no } = currentCardInfo;
    if ((task_status === 20 || task_status === '20') && task_category === 'PLM') {
      currentCardInfo['plmDisabledEdit'] = true;
      this.apiService
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

  findParentCard(cardList: any, card: any): void {
    cardList.forEach((item: any): void => {
      if (item.task_no === card.upper_level_task_no) {
        card.level = item.level + 1;
        card.children = [];
        item.children.push(card);
        this.changeRef.markForCheck();
      } else {
        if (item.children && item.children.length) {
          this.findParentCard(item.children, card);
        }
      }
    });
  }

  getCurrentTaskInfo(event: any): void {
    this.findParentCard(this.wbsService.pageDatas, event);
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

  deleteCard(list, currentCard) {
    list.map((item, index) => {
      if (item.task_no === currentCard.task_no) {
        list.splice(index, 1);
        this.changeRef.markForCheck();
      } else {
        if (item.children && item.children.length) {
          this.deleteCard(item.children, currentCard);
        }
      }
    });
  }

  async delete(card, event): Promise<any> {
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
        this.messageService.error(this.translateService.instant('dj-pcc-不可删除'));
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
    event.stopPropagation();
    card.isOperationsShow = false;
    this.confirmDeleteVisible = true;
    this.changeRef.markForCheck();
  }

  // 删除任务卡点击确定
  handleOk() {
    this.confirmDeleteVisible = false;
    const { project_status } = this.wbsService.projectInfo;
    // 项目状态30 project_status === 30 且 项目计划维护入口时需输入变更原因
    // if (Number(project_status) === 30 && ((this.source === Entry.card) || (this.source === Entry.collaborate))) {
    if (Number(project_status) === 30 && this.source === Entry.card) {
      this.changeReason.showModal();
    } else {
      this.deleteRequest();
    }
  }
  // 变更原因确定
  changeReasonOk(value) {
    this.deleteRequest(value);
  }
  // 删除任务卡点击删除
  handleCancel() {
    this.confirmDeleteVisible = false;
  }
  // 删除任务卡提交
  async deleteRequest(changeReason?: string): Promise<void> {
    const task_info = {
      task_no: this.currentCard.task_no,
      project_no: this.wbsService.project_no,
      operation_no: this.userService.getUser('userId'),
      operation_name: this.userService.getUser('userName'),
      task_property: this.source === Entry.maintain ? '2' : '1',
    };
    if (changeReason) {
      task_info['change_reason'] = changeReason;
      task_info['record_task_change'] = true;
    } else {
      task_info['record_task_change'] = false;
    }
    if (this.source === Entry.collaborate) {
      task_info['record_task_change'] =
        Number(this.wbsService.projectInfo?.project_status) < 30 ? false : true;
    }
    if (this.source === Entry.maintain) {
      Reflect.deleteProperty(task_info, 'operation_no');
      Reflect.deleteProperty(task_info, 'operation_name');
    }
    // 若交付設計器.是否依賴地端=true傳入Y否則傳入N
    task_info['sync_steady_state'] = this.wbsService.hasGroundEnd !== 'Y' ? null : 'Y'; // 同步稳态	Y.同步；N.不同步 不传或传null，默认Y
    let res;
    if (this.source === Entry.collaborate) {
      const assist_task_detail_info = {
        // 协同排定任务明细信息
        can_delete_required_task: false,
        assist_task_detail_info: [
          {
            assist_schedule_seq: this.root_task_card.assist_schedule_seq, // 协助排定计划序号
            project_no: this.wbsService.project_no, // 项目编号
            root_task_no: this.root_task_card.root_task_no, // 根任务编号
            task_no: this.currentCard.task_no, // 任务编号
          },
        ],
      };
      res = await this.projectPlanCardService.deleteAssistTaskDetail(assist_task_detail_info);
      if (res?.error_msg) {
        this.messageService.error(res?.error_msg);
        return;
      }
    } else if (this.source === Entry.projectChange) {
      const deleteParams = {
        sync_steady_state: this.wbsService.hasGroundEnd !== 'Y' ? null : 'Y',
        project_change_task_detail_info: [
          {
            project_no: this.wbsService.project_no, // 项目编号
            change_version: this.wbsService.change_version,
            task_no: this.currentCard.task_no, // 任务编号
          },
        ],
      };
      res = await this.projectPlanCardService.deleteTaskChangeInfo(deleteParams);
      if (res?.error_msg) {
        this.messageService.error(res?.error_msg);
        return;
      }
    } else {
      let deleteParams;
      if (this.source === Entry.card) {
        deleteParams = {
          task_info: [task_info],
          is_sync_document: this.wbsService.is_sync_document,
        };
      } else {
        deleteParams = { task_info: [task_info] };
      }
      res = await this.projectPlanCardService.deleteTaskInfo(deleteParams);
      if (res?.data?.task_info?.[0]?.project_no_mistake_message) {
        this.messageService.error(res?.data?.task_info?.[0]?.project_no_mistake_message);
        return;
      }
    }
    // 任务比重校验 -- delete
    this.changeTaskCardProportion();
    this.wbsService.pageChange.next(true);

    this.deleteCard(this.wbsService.pageDatas, this.currentCard);
    this.wbsService.$newCardInfo.next({});
    this.wbsService.cardLevelHandle(this.wbsService.pageDatas, 0);
    this.wbsService.calculationChildrenLength(this.wbsService.pageDatas);
    this.messageService.success(this.translateService.instant('dj-default-删除成功'));

    // 可以协同的一级计划捞取方式:
    if (this.wbsService.projectInfo?.project_status === '30') {
      this.wbsService.firstTaskCardList = this.wbsService.pageDatas.filter((task) => {
        return (
          task.liable_person_code &&
          task.complete_rate < 100 &&
          task.upper_level_task_no === task.task_no &&
          !['PCM', 'ASSC_ISA_ORDER'].includes(task.task_category)
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

    if (this.source === Entry.card) {
      this.finalList = [];
      for (const i in res.data.task_info) {
        if (res.data.task_info[i].task_no) {
          this.finalList.push({
            project_no: res.data.task_info[i].project_no,
            task_no: res.data.task_info[i].task_no,
          });
        }
      }
      const tenantId = this.userService.getUser('tenantId');
      if (this.finalList.length > 0) {
        if (this.wbsService.modelType.indexOf('DTD') !== -1) {
          const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
          const id = this.userService.getUser('userId');
          this.addSubProjectCardService
            .addOrDeleteTaskCardNew(
              DwUserInfo.acceptLanguage,
              id,
              this.finalList,
              this.commonService.content
            )
            .subscribe((res2) => {});
        } else {
          this.addSubProjectCardService
            .addOrDeleteTaskCard(tenantId, this.finalList, this.commonService.content)
            .subscribe((res2) => {});
        }
      }
    }

    this.changeRef.markForCheck();

    this.confirmDeleteVisible = false;
  }

  // 任务卡片，右下角(+) ，添加下级任务卡片
  async addSubProjectCard(currentCardInfo: any): Promise<void> {
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
          this.messageService.error(this.translateService.instant('dj-pcc-非负责人'));
          return;
        }
        // 协同任务卡需要校验根任务协同计划排定状态为进行中才可以编辑
        const assistScheduleInfo = await this.taskWbsListService.getAssistScheduleInfo(
          this.root_task_card?.root_task_no
        );
        if (assistScheduleInfo[0]?.schedule_status !== '1') {
          this.messageService.error(this.translateService.instant('dj-pcc-不为进行中'));
          return;
        }
      }
    }
    const firstLevelTaskCard = this.wbsService.getCurrentCorridor(currentCardInfo);
    const title = this.translateService.instant('dj-default-添加子项');
    if (this.source === Entry.card) {
      this.commonService
        .getProjectChangeStatus(
          currentCardInfo.project_no,
          ['1', '2', '3', '4', '5'],
          '1',
          currentCardInfo.task_no
        )
        .subscribe(
          (resChange: any): void => {
            this.addSubProjectCardService.openAddSubProjectCard(
              title,
              ButtonType.PLUS,
              firstLevelTaskCard,
              currentCardInfo,
              this.source
            );
            this.addSubProjectCardService.showAddTaskCard = true;
            this.changeRef.markForCheck();
          },
          (error) => {}
        );
    } else {
      this.addSubProjectCardService.openAddSubProjectCard(
        title,
        ButtonType.PLUS,
        firstLevelTaskCard,
        currentCardInfo,
        this.source
      );
      this.changeRef.markForCheck();
    }
  }

  preview(currentCardInfo, event) {
    this.addSubProjectCardService.isPreview = true;
    this.addSubProjectCardService.showAddTaskCard = false;
    currentCardInfo.isOperationsShow = false;
    event.stopPropagation();
    this.currentEditingCard = currentCardInfo;
    const firstLevelTaskCard = this.wbsService.getCurrentCorridor(currentCardInfo); // 获取每列第一个任务卡
    const title =
      currentCardInfo.level === 0
        ? this.translateService.instant('dj-c-预览')
        : this.translateService.instant('dj-c-预览');
    this.addSubProjectCardService.openAddSubProjectCard(
      title,
      ButtonType.PREVIEW,
      firstLevelTaskCard,
      currentCardInfo,
      this.source
    );
  }

  edit(currentCardInfo, event) {
    // plm项目需要调plm.work.item.status.process接口查询状态用于管控负责人栏位是否禁用，该接口比较慢会造成打开wbs卡片后还未请求返回导致管控失效
    if (
      (!currentCardInfo.canEdit && this.source !== Entry.maintain) ||
      currentCardInfo.plmDisabledEdit
    ) {
      return;
    }
    this.addSubProjectCardService.showAddTaskCard = false;
    currentCardInfo.isOperationsShow = false;
    event.stopPropagation();
    this.currentEditingCard = currentCardInfo;
    const firstLevelTaskCard = this.wbsService.getCurrentCorridor(currentCardInfo); // 获取每列第一个任务卡
    const title =
      currentCardInfo.level === 0
        ? this.translateService.instant('dj-default-编辑一级计划')
        : this.translateService.instant('dj-default-编辑子项');
    this.addSubProjectCardService.openAddSubProjectCard(
      title,
      ButtonType.EDIT,
      firstLevelTaskCard,
      currentCardInfo,
      this.source
    );
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

  translatePccWord(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  closeErrorCard(id, event) {
    event.stopPropagation();
    this.closeList.push(id);
  }

  // 子项开窗，新增、编辑后，获取最新的任务比重信息
  changeTaskCardProportion(): void {
    this.changeWbsTaskCardProportion.emit();
    this.changeRef.markForCheck();
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

  hasTaskProportion(task_no: string): boolean {
    return this.wbsService.taskProportionCheck['task_no'].find((v) => {
      return v === task_no;
    });
  }

  hasEdit(item): boolean {
    const hasEditFromTaskNoArr = sessionStorage.getItem(
      'hasEditFromTaskNoArr' + this.wbsService.project_no
    );
    let hasEditFromTaskNoArr2: Array<string> = [];
    if (hasEditFromTaskNoArr) {
      hasEditFromTaskNoArr2 = hasEditFromTaskNoArr.split(',');
    }
    return item.hasEdit || hasEditFromTaskNoArr2.includes(item.task_no);
  }

  // 判断当前任务卡是否属于协同中的树，屏蔽添加下阶功能
  // getAncestorsCollaboration(item): boolean {
  //   if (this.collaborationTaskNoList.length && this.collaborationTaskNoList.includes(item.task_no)) {
  //     return item.complete_rate > 0;
  //   }else{
  //     return false;
  //   }
  // }

  // 返回【任务类型名称：任务类型】
  getTaskCategoryInfo(item) {
    let info = '';
    if (item.task_category === 'ORD') {
      info = this.translatePccWord('一般') + '：' + this.translatePccWord('手动任务');
    } else {
      const category = this.wbsService.TaskType[item.task_category];
      info = item.task_template_name + '：' + category;
    }
    return info;
  }
  CollaborationEnterHandler($cancelCollaboration) {
    if (
      $cancelCollaboration.isOk ||
      $cancelCollaboration.confirmVisible ||
      $cancelCollaboration.loading
    ) {
      return;
    }
    this.inCollaboration = false;
  }
  CollaborationLeaveHandler($cancelCollaboration) {
    if (
      $cancelCollaboration.isOk ||
      $cancelCollaboration.confirmVisible ||
      $cancelCollaboration.loading
    ) {
      return;
    }
    this.inCollaboration = true;
  }
  cancelCollaborationVisibleChange(e) {
    this.inCollaboration = !e;
  }
  cancelCollaborationSuccess() {
    this.wbsService.pageChange.next(true);
  }
  cancelCollaborationFullFail() {}
}
