import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  ChangeDetectorRef,
  SkipSelf,
  ViewChild,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { DynamicWbsService } from '../wbs/wbs.service';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { CommonService, Entry } from 'app/customization/task-project-center-console/service/common.service';
import { DragDropService } from '../../directive/dragdrop/dragdrop.service';
import {
  DynamicUserBehaviorCommService,
  PluginLanguageStoreService,
} from '@ng-dynamic-forms/core';
import { DwUserService } from '@webdpt/framework/user';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';
import { ButtonType } from '../add-subproject-card/add-subproject-card.interface';
import { AthMessageService } from 'ngx-ui-athena/src/components/message';


@Component({
  selector: 'app-project-plan-card',
  templateUrl: './project-plan-card.component.html',
  styleUrls: ['./project-plan-card.component.less'],
})


/**
 * 项目计划维护
 */
export class ProjectPlanCardComponent implements OnInit, OnChanges, OnDestroy {
  // wbs入口
  @Input() source: Entry = Entry.card
  @Input() planCardList: any;
  @Input() listIndex: number;

  @Input() showStatus: boolean = true;
  @Input() showAddIcon: boolean = true;

  @Input() from: string = ''
  @Input() hasGroundEnd: any; // 交付设计器，是否依赖地端
  @Input() hasT100: boolean = false; // 交付设计器，是否依赖地端

  // @Input() collaborationTaskNoList: string[] = [];
  @Output() changeWbsTaskCardProportion = new EventEmitter<any>();

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

  constructor(
    @SkipSelf()
    public wbsService: DynamicWbsService,
    public addSubProjectCardService: AddSubProjectCardService,
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    private messageService: NzMessageService,
    private userService: DwUserService,
    public wbsTabsService: WbsTabsService,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
    private pluginLanguageStoreService: PluginLanguageStoreService,
    private athMessageService: AthMessageService
  ) {
    this.editCode = 'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON002';
  }

  isIssueTaskCard(item: object): boolean {
    // 修复：spring 1.8 拖拽功能管控
    // 整棵树存在已下发的任务卡（is_issue_task_card=true）则整棵树不可拖拽，也不可拖拽其它任务至这棵树
    return (item !== null) && (item !== undefined) && item['is_issue_task_card'];
  }

  onDrop(e: DragDropService, target, index) {
    if (e.dragData.item.disabled || target.disabled ||
      e.dragData.item.task_no === e.dragData.item.upper_level_task_no || !e.dragData.item.upper_level_task_no) {
      return;
    }
    if (this.hasT100 && (this.hasGroundEnd === 'Y') && (this.wbsService.projectInfo?.project_status !== '10')) {
      return;
    }

    const finder1 = this.wbsService.hasTaskProportionForThisTree(e.dragData.item.task_no);
    const finder2 = this.wbsService.hasTaskProportionForThisTree(target.task_no);
    if (finder1 || finder2) {
      return;
    }

    this.wbsService.onDrop(e, target, () => { this.changeRef.markForCheck(); }, this.source, index);
    this.changeRef.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges): void { }

  ngOnInit() { }

  dropStartEvent(): void {
    this.isShowPopover = false;
  }

  ngOnDestroy(): void {

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
  editOrDelete(item: any, event: any): void {
    event.stopPropagation();
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
      if (res.data?.project_info[0]) {
        const data = res.data?.project_info[0];
        item.task_dependency_info = data.task_dependency_info;
        item.is_issue_task_card = data.is_issue_task_card;
        item.attachment = data.attachment;
        item.task_status = data.task_status;
        item.unEdit = data.task_status > 20 ? true : false;
        item.remarks = data.remarks;
        item.upper_level_task_no = data.upper_level_task_no;
        if (Number(data.project_status) > 10) {
          this.wbsService.projectInfo.project_status = data.project_status;
        }
        this.showEditOrDelete(item, event);
      }
    });
  }

  showEditOrDelete(item: any, event: any) {
    const corridorData = this.wbsService.getCurrentCorridor(item);
    if (this.source === Entry.collaborate && item.level === 0) {
      item.currentCorridorDisabled = true;
    }
    if (corridorData['task_status'] === '20') {
      item.currentCorridorDisabled = true;
    }
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
    if (card.noEdit || card.unDelete) {
      return;
    }
    if (this.source !== Entry.maintain) {
      const { data } = await this.wbsService.getInfoCheck(this.wbsService.project_no).toPromise();
      this.wbsService.needRefresh = data.check_result;
    }
    if (this.wbsService.needRefresh) {
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
    if (Number(project_status) === 30 && (this.source === Entry.card)) {
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
  deleteRequest(changeReason?: string) {
    const task_info = {
      task_no: this.currentCard.task_no,
      project_no:
        this.wbsService.project_no,
      operation_no: this.userService.getUser('userId'),
      operation_name: this.userService.getUser('userName'),
      task_property: this.source === Entry.maintain ? '2' : '1'
    };
    if (changeReason) {
      task_info['change_reason'] = changeReason;
      task_info['record_task_change'] = true;
    } else {
      task_info['record_task_change'] = false;
    }
    if (this.source === Entry.collaborate) {
      task_info['record_task_change'] = (Number(this.wbsService.projectInfo?.project_status) < 30) ? false : true;
    }
    if (this.source === Entry.maintain) {
      Reflect.deleteProperty(task_info, 'operation_no');
      Reflect.deleteProperty(task_info, 'operation_name');
    }
    // 若交付設計器.是否依賴地端=true傳入Y否則傳入N
    task_info['sync_steady_state'] = this.wbsService.hasGroundEnd !== 'Y' ? null : 'Y'; // 同步稳态	Y.同步；N.不同步 不传或传null，默认Y
    const params = {
      task_info: [task_info],
    };
    this.commonService.getInvData('task.info.delete', params).subscribe((res) => {
      if (res.data.task_info[0]?.project_no_mistake_message) {
        this.messageService.error(res.data.task_info[0]?.project_no_mistake_message);
        return;
      }
      this.deleteCard(this.wbsService.pageDatas, this.currentCard);
      this.wbsService.$newCardInfo.next({});
      this.wbsService.cardLevelHandle(this.wbsService.pageDatas, 0);
      this.wbsService.calculationChildrenLength(this.wbsService.pageDatas);
      this.messageService.success(this.translateService.instant('dj-default-删除成功'));

      // 可以协同的一级计划捞取方式:
      if (this.wbsService.projectInfo?.project_status === '30') {
        this.wbsService.firstTaskCardList = this.wbsService.pageDatas.filter(task => {
          return task.liable_person_code && task.plan_start_date && task.plan_finish_date
            && (task.complete_rate < 100) && (task.upper_level_task_no === task.task_no);
        });
        this.changeRef.markForCheck();
      } else {
        // 启动前(项目状态=10.未开始)
        this.wbsService.firstTaskCardList = this.wbsService.pageDatas.filter(
          (task: any): void =>
            task.liable_person_code && task.plan_start_date && task.plan_finish_date
        );
      }

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
      if (((this.source === Entry.card) || (this.source === Entry.collaborate)) && this.finalList.length > 0) {
        if ((this.wbsService.modelType.indexOf('DTD') !== -1) || (this.source === Entry.collaborate)) {
          const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
          const id = this.userService.getUser('userId');
          this.addSubProjectCardService
            .addOrDeleteTaskCardNew(
              DwUserInfo.acceptLanguage,
              id,
              this.finalList,
              this.commonService.content
            )
            .subscribe((res2) => { });
        } else {
          this.addSubProjectCardService
            .addOrDeleteTaskCard(tenantId, this.finalList, this.commonService.content)
            .subscribe((res2) => { });
        }
      }
      // 任务比重校验 -- delete
      this.changeWbsTaskCardProportion.emit();
      this.changeRef.markForCheck();
    });
    this.confirmDeleteVisible = false;
  }

  // 任务卡片，右下角(+) ，添加下级任务卡片
  addSubProjectCard(currentCardInfo: any): void {
    const firstLevelTaskCard = this.wbsService.getCurrentCorridor(currentCardInfo);
    const title = this.translateService.instant('dj-default-添加子项');
    this.addSubProjectCardService.openAddSubProjectCard(title, ButtonType.PLUS, firstLevelTaskCard, currentCardInfo);
  }

  edit(currentCardInfo, event) {
    if (currentCardInfo.unEdit && this.source !== Entry.maintain) {
      return;
    }
    this.addSubProjectCardService.showAddTaskCard = false;
    currentCardInfo.isOperationsShow = false;
    event.stopPropagation();
    this.currentEditingCard = currentCardInfo;
    const firstLevelTaskCard = this.wbsService.getCurrentCorridor(currentCardInfo);  // 获取每列第一个任务卡
    const title = currentCardInfo.level === 0
      ? this.translateService.instant('dj-default-编辑一级计划') : this.translateService.instant('dj-default-编辑子项');
    this.addSubProjectCardService.openAddSubProjectCard(title, ButtonType.EDIT, firstLevelTaskCard, currentCardInfo);
  }


  isHiddenAdd(item): boolean {
    const condition1 = (this.hiddenAdd(item, 2)
      && this.wbsService.editable) || this.source === Entry.maintain;
    const condition2 = !this.hasTaskProportionCheck(item);
    if (condition1 && condition2) {
      return true;
    } else {
      return false;
    }
  }

  hiddenAdd(item, type) {
    // if (this.source === Entry.card) {
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
    }
    return !unShow;
    // } else {
    //   return true;
    // }
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
    if ((Number(this.wbsService.projectInfo?.project_status) > 20)
      && ((this.source === Entry.card) || (this.source === Entry.collaborate))) {
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
      if (children.children.length) {
        children.children.forEach(v => {
          this.getUpperTask(v, array, flag);
        });
      }
    }
  }

  // 找到每组计划中，下阶任务的任务比重<1的，返回每组计划的任务的task_no
  hasTaskProportionCheck(data): boolean {
    let taskNos: Set<string> = new Set();
    if ((Number(this.wbsService.projectInfo?.project_status) > 20)
      && ((this.source === Entry.card) || (this.source === Entry.collaborate))) {
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

  hasTaskProportion(task_no: string): boolean {
    const { task_info } = this.wbsService.taskProportionCheck;
    const taskNo = task_info[0]['task_no'].split(',');
    return taskNo.find(v => { return v === task_no; });
  }

  hasEdit(item): boolean {
    const hasEditFromProjectNo = sessionStorage.getItem('hasEditFromProjectNo');
    let hasEditFromTaskNoArr: Array<string> = [];
    if (hasEditFromProjectNo) {
      hasEditFromTaskNoArr = sessionStorage.getItem('hasEditFromTaskNoArr').split(',');
    }
    return item.hasEdit || hasEditFromTaskNoArr.includes(item.task_no);
  }

  // 判断当前任务卡是否属于协同中的树，屏蔽添加下阶功能
  // getAncestorsCollaboration(item): boolean {
  //   if (this.collaborationTaskNoList.length && this.collaborationTaskNoList.includes(item.task_no)) {
  //     return item.complete_rate > 0;
  //   }else{
  //     return false;
  //   }
  // }
}
