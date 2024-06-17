import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ButtonType } from 'app/implementation/component/add-subproject-card/add-subproject-card.interface';
import { AddSubProjectCardService } from 'app/implementation/component/add-subproject-card/add-subproject-card.service';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
import { Entry } from 'app/implementation/service/common.service';
import {
  cardStatusMap,
  CardStatusCode,
  successStatusGen,
  taskStatusGen,
  cardExecutionStatus,
  cardExecutionStatusCode,
  errorStatusGen,
  primaryStatusGen,
  warningStatusGen,
  setCardStatus,
  cardStatusId,
} from '../card-status.config';
import { cloneDeep, isEmpty } from '@athena/dynamic-core';
@Component({
  selector: 'app-card-head',
  templateUrl: './card-head.component.html',
  styleUrls: ['./card-head.component.less'],
})
export class CardHeadComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input()
  get cardInfo() {
    return this.item;
  }
  set cardInfo(val: any) {
    if (isEmpty(val)) {
      return;
    }
    this.item = val;
    this.changeTagHandler();
  }
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
  @ViewChild('cardStatusWrapper') cardStatusWrapper;
  cardExecutionStatusCode = cardExecutionStatusCode;
  Entry = Entry;
  isEmpty = isEmpty;
  currentEditingCard: any;
  item: any;
  // 协同中状态
  inCollaboration: boolean = false;
  get isTrackPages() {
    return this.wbsService.isTrackPages && this.source === Entry.card;
  }
  get isLeaf() {
    return this.item.children && !this.item.children.length;
  }
  get upperLevel() {
    return !this.item.upper_level_task_no || this.item.upper_level_task_no === this.item.task_no;
  }
  get middleLeaf() {
    return this.item.upper_level_task_no && !this.isLeaf;
  }
  get canCancelCollaboration() {
    return (
      this.wbsService.projectInfo.curUserId === this.wbsService.projectInfo.project_leader_code
    );
  }
  cardStatusContentOverflow: boolean = false;
  newAddCard: boolean = false;
  constructor(
    public wbsService: DynamicWbsService,
    public addSubProjectCardService: AddSubProjectCardService,
    private translateService: TranslateService,
    public changeRef: ChangeDetectorRef
  ) {}

  ngOnInit() {}
  ngOnChanges(changes: SimpleChanges) {}
  ngAfterViewInit() {}
  ngOnDestroy() {}
  listeningStorageChange() {
    // 添加事件监听器
    window.addEventListener('storage', this.storageChangeHandler);
  }
  cancelStorageChange() {
    window.removeEventListener('storage', this.storageChangeHandler);
  }
  private storageChangeHandler = (e) => {
    console.log(e);
  };
  translatePccWord(val: string, op = {}): string {
    return this.translateService.instant(`dj-pcc-${val}`, op);
  }
  private changeTagHandler() {
    // 项目变更签核标记
    if (this.sourceRealy === Entry.projectChangeSignOff && this.cardInfo.change_type === '1') {
      this.newAddCard = true;
    }
  }
}
