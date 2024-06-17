import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { DynamicWbsService } from '../../wbs.service';
import { AddSubProjectCardService } from 'app/implementation/component/add-subproject-card/add-subproject-card.service';
import { TranslateService } from '@ngx-translate/core';
import { DwUserService } from '@webdpt/framework';
import { WbsTabsService } from 'app/implementation/component/wbs-tabs/wbs-tabs.service';
import { DynamicUserBehaviorCommService, isEmpty } from '@athena/dynamic-core';
import { AthMessageService } from '@athena/design-ui';
import { ProjectPlanCardV2Service } from 'app/implementation/component/project-plan-card-v2/project-plan-card.service';
// eslint-disable-next-line max-len
import { TaskWbsListService } from 'app/implementation/programs/task-detail/cooperation-task/components/task-wbs-list/task-wbs-list.service';
import { APIService } from 'app/implementation/service/api.service';
import { CardOperationComponent } from './components/card-operation/card-operation.component';
import { WbsCardService } from './wbs-card.service';
import { UUID } from 'angular2-uuid';
import { ButtonType } from 'app/implementation/component/add-subproject-card/add-subproject-card.interface';
import { NzPopoverDirective } from 'ng-zorro-antd/popover';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-wbs-card',
  templateUrl: './wbs-card.component.html',
  styleUrls: ['./wbs-card.component.less'],
  providers: [AthMessageService, ProjectPlanCardV2Service, TaskWbsListService, WbsCardService],
})
export class WbsCardComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() parentWbsCardCop: WbsCardComponent;
  // wbs入口
  @Input() source: Entry = Entry.card;
  @Input() errorInfoList: any[] = [];
  @Input() sourceRealy = '';
  @Input() planCardList: any;
  @Input() listIndex: number;
  @Input() hasAuth: boolean = true;
  @Input()
  get cardInfo() {
    return this._cardInfo;
  }
  set cardInfo(val) {
    if (isEmpty(val)) {
      return;
    }
    if (isEmpty(val.canEdit)) {
      val.canEdit = true;
    }
    this._cardInfo = val;
  }
  private _cardInfo: any = {};
  @Input() showStatus: boolean = true;
  @Input() showAddIcon: boolean = true;
  @Input() canCancelCollaboration;
  @Input() from: string = '';
  @Input() hasGroundEnd: any; // 交付设计器，是否依赖地端
  @Input() hasT100: boolean = false; // 交付设计器，是否依赖地端
  @Input() root_task_card = {
    // 协同一级计划任务卡信息
    root_task_no: '', // 根任务卡编号
    schedule_status: '', // 协助计划排定状态
    assist_schedule_seq: '', // 协助排定计划序号
  };
  // 变更状态
  @Input() change_status: string;
  // 原任务状态
  @Input() old_task_status: string;
  @Input() signOff: boolean = false;
  @Input() taskChildrenNos: any = [];
  @Input() currentCard: any;
  @Input() addFirstPlanStartDrag: boolean = false;
  @Input() triggerConfirmDeleteVisible = () => {};
  @Input() isDragging = false;
  @Output() rendered = new EventEmitter();
  @ViewChild('cardOperation') cardOperation: CardOperationComponent;
  @ViewChild('wbsCardPopover', { static: false }) wbsCardPopover: NzPopoverDirective;
  @ViewChild('contentTemplate', { read: ViewContainerRef }) contentTemplate: ViewContainerRef;
  private contentComponentRef: ComponentRef<CardOperationComponent>;
  operationHidden: boolean = true;
  editOrDeleteCtr;
  hideOperationCtr;
  isRendered = false;
  // 其他信息
  otherInfo = {
    cardMarginBottom: 16, // 当前卡片底部间距
    cardWireEndpointsMarginTop: 20, // 连线起点到顶部间距
    cardShowAndHiddenBtnPositionBottom: 8, // 当前卡片展开收起底部按钮位置
    cardHeight: 0, // 当前卡片高度
    cardWidth: 0, // 当前卡片宽度
    cardChildeHeight: 0, // 子卡片总高度
    connectHeight: 0, // 连线总高度
    children: [],
  };
  popoverVisible: boolean = false;
  popoverTrigger = 'hover';
  popoverMouseEnterDelay = 0.5;
  popoverMouseLeaveDelay = 0.2;
  currentEditingCard;
  setPopoverConfig = (config) => {
    if (config.popoverVisible !== undefined) {
      this.popoverVisible = config.popoverVisible;
    }
    if (config.popoverTrigger !== undefined) {
      this.popoverTrigger = config.popoverTrigger;
    }
    if (config.markForCheck) {
      this.changeRef.markForCheck();
    }
  };
  get isTrackPages() {
    return this.wbsService.isTrackPages && this.source === Entry.card;
  }
  componentId = UUID.UUID();
  sub: Subscription = new Subscription();

  constructor(
    public wbsService: DynamicWbsService,
    public addSubProjectCardService: AddSubProjectCardService,
    public changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    private userService: DwUserService,
    public wbsTabsService: WbsTabsService,
    private elementRef: ElementRef,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
    private athMessageService: AthMessageService,
    private projectPlanCardService: ProjectPlanCardV2Service,
    private taskWbsListService: TaskWbsListService,
    private apiService: APIService,
    private zone: NgZone,
    private wbsCardService: WbsCardService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}
  ngOnInit() {
    this.wbsService['cancelCollaborationSuccessFlag'] = false;
  }
  ngAfterViewInit() {
    // this.popoverVisible = this.cardInfo.task_name === '44';
    this.isRendered = true;
    this.sendRendered();
  }
  ngOnChanges(changes: SimpleChanges) {}
  ngOnDestroy() {
    this.sub.unsubscribe();
  }
  sendRendered() {
    if (this.elementRef.nativeElement.offsetHeight !== 0) {
      const nativeElement = this.elementRef.nativeElement,
        domRect = nativeElement.getBoundingClientRect();
      this.otherInfo.cardHeight = domRect.height || nativeElement.offsetHeight;
      this.otherInfo.cardWidth = domRect.width || nativeElement.offsetWidth;
      let parentInfo = null;
      if (this.parentWbsCardCop && this.parentWbsCardCop !== this) {
        const parentOtherInfo = this.parentWbsCardCop.getCardOtherInfo();
        parentOtherInfo.children.push(this.otherInfo);
        parentInfo = {
          parentWbsCardCop: this.parentWbsCardCop,
          otherInfo: parentOtherInfo,
        };
      }
      this.rendered.emit({
        otherInfo: this.otherInfo,
        data: this.cardInfo,
        setOtherInfo: this.setCardOtherInfo.bind(this),
        markForCheck: this.markForCheck.bind(this),
        parentInfo: parentInfo,
      });
    } else {
      requestAnimationFrame(() => {
        this.sendRendered();
      });
    }
  }

  setCardOtherInfo(info) {
    this.otherInfo = info;
  }
  markForCheck() {
    this.changeRef.markForCheck();
  }
  getCardOtherInfo(key?: string) {
    if (key) {
      return this.otherInfo[key];
    }
    return this.otherInfo;
  }
  popoverVisibleChange(e) {
    this.popoverVisible = e;
  }
  setPopoverVisible(e) {
    if (e) {
      this.wbsCardPopover.component.show();
    } else {
      this.wbsCardPopover.component.hide();
    }
    this.changeRef.markForCheck();
  }

  closeErrorCard(id, event) {
    event.stopPropagation();
    this.errorInfoList.push(id);
  }
  translatePccWord(val: string, op = {}): string {
    return this.translateService.instant(`dj-pcc-${val}`, op);
  }
  hasTaskProportion(task_no: string): boolean {
    return this.wbsService.taskProportionCheck['task_no'].find((v) => {
      return v === task_no;
    });
  }
  /**
   * card-operation中也有此方法
   */
  preview(currentCardInfo, e: Event) {
    if (e) {
      return;
    }
    e?.stopPropagation();
    this.setPopoverVisible(false);
    this.addSubProjectCardService.isPreview = true;
    this.addSubProjectCardService.showAddTaskCard = false;
    currentCardInfo.isOperationsShow = false;
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
}
