import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  SkipSelf,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { DynamicWbsService } from '../wbs/wbs.service';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { DragDropService } from '../../directive/dragdrop/dragdrop.service';
import {
  DynamicUserBehaviorCommService,
  controlMarkShowErrorByHasValidator,
  isEmpty,
  isNotEmpty,
} from '@athena/dynamic-core';
import { DwUserService } from '@webdpt/framework/user';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';
import { ButtonType } from '../add-subproject-card/add-subproject-card.interface';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { TaskWbsListService } from '../../programs/task-detail/cooperation-task/components/task-wbs-list/task-wbs-list.service';
import { APIService } from '../../service/api.service';
import { ProjectPlanCardV2Service } from './project-plan-card.service';
import { debounceTime, delay } from 'rxjs/operators';
import { WbsCardComponent } from '../wbs/components/wbs-card/wbs-card.component';

@Component({
  selector: 'app-project-plan-card-v2',
  templateUrl: './project-plan-card.component.html',
  styleUrls: ['./project-plan-card.component.less'],
  providers: [ProjectPlanCardV2Service, TaskWbsListService],
})

/**
 * 项目计划维护
 */
export class ProjectPlanCardV2Component
  implements OnInit, OnChanges, OnDestroy, AfterViewInit, AfterContentChecked
{
  // wbs入口
  @Input() source: Entry = Entry.card;
  @Input() sourceRealy = '';
  @Input() planCardList: any;
  @Input() listIndex: number;
  @Input() hasAuth: boolean = true;
  @Input() addFirstPlanStartDrag: boolean = false;
  @Input() showStatus: boolean = true;
  @Input() showAddIcon: boolean = true;
  @Input() parentNode: ProjectPlanCardV2Component;
  @Input() parentWbsCardCop: WbsCardComponent;
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
  @Input() parentCardWrapperEl;
  // @Input() collaborationTaskNoList: string[] = [];
  @Output() changeWbsTaskCardProportion = new EventEmitter<any>();
  @Output() refreshPageChange: EventEmitter<any> = new EventEmitter();
  @ViewChild('changeReason') changeReason: any;
  @ViewChild('wbsCardCop') wbsCardCop: WbsCardComponent;
  @ViewChild('connection') connectionEl: ElementRef<HTMLElement>;
  @ViewChildren('cardWrapper') cardWrapperList: QueryList<HTMLElement>;
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
  cardMarginBottom = 16;
  isDragging: boolean = false;
  get canCancelCollaboration() {
    return (
      this.wbsService.projectInfo.curUserId === this.wbsService.projectInfo.project_leader_code
    );
  }
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
    private projectPlanCardService: ProjectPlanCardV2Service,
    private taskWbsListService: TaskWbsListService,
    private apiService: APIService,
    private zone: NgZone,
    private elementRef: ElementRef
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

  ngAfterContentChecked() {}
  ngAfterViewInit() {
    /** 子卡片渲染完毕后,手动触发下变更检测,否则获取卡片高度等信息在视图上不更新 */
    this.changeRef.detectChanges();
  }
  // 存储卡片高度
  onCardRendered(e) {
    this.cardMarginBottom = e.otherInfo.cardMarginBottom;
    this.wbsService.setWbsCardAboutInfoAfterRender(e);
  }

  ngOnDestroy(): void {}

  /**
   *
   * @param item 展开/收起子节点
   */
  showOrHideChildren(item: any, cardInstance: WbsCardComponent): void {
    item.isChildrenshow = !item.isChildrenshow;
    this.wbsService.setWbsCardShowOrHideAboutInfo(item, cardInstance);
    this.changeRef.markForCheck();
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

  triggerConfirmDeleteVisible(flag: boolean = false, currentCard?: any) {
    this.confirmDeleteVisible = flag;
    if (currentCard) {
      this.currentCard = currentCard;
    }
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
    // this.wbsService.calculationChildrenLength(this.wbsService.pageDatas);
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
}
