import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { AthMessageService, isEmpty } from '@athena/design-ui';
import { TranslateService } from '@ngx-translate/core';
import { ButtonType } from 'app/implementation/component/add-subproject-card/add-subproject-card.interface';
import { AddSubProjectCardService } from 'app/implementation/component/add-subproject-card/add-subproject-card.service';
import { ProjectPlanCardV2Service } from 'app/implementation/component/project-plan-card-v2/project-plan-card.service';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
// eslint-disable-next-line max-len
import { TaskWbsListService } from 'app/implementation/programs/task-detail/cooperation-task/components/task-wbs-list/task-wbs-list.service';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { cardExecutionStatus, cardExecutionStatusCode } from '../card-status.config';
import { UUID } from 'angular2-uuid';

@Component({
  selector: 'app-card-body',
  templateUrl: './card-body.component.html',
  styleUrls: ['./card-body.component.less'],
})
export class CardBodyComponent implements OnInit {
  @Input() get cardInfo() {
    return this._item;
  }
  set cardInfo(val: any) {
    if (isEmpty(val)) {
      return;
    }
    this._item = val;
    this.initCardExecutionStatus();
  }
  @Input() sourceRealy = '';
  @Input() hasAuth: boolean = true;
  @Input() source: Entry = Entry.card;
  @Input() signOff: boolean = false;
  @Input() taskChildrenNos: any = [];
  @Input() canCancelCollaboration;
  @Input() showAddIcon: boolean = true;
  // 变更状态
  @Input() change_status: string;
  // 原任务状态
  @Input() old_task_status: string;
  @Input() root_task_card = {
    // 协同一级计划任务卡信息
    root_task_no: '', // 根任务卡编号
    schedule_status: '', // 协助计划排定状态
    assist_schedule_seq: '', // 协助排定计划序号
  };
  @Input() cardLeave = () => {};
  @Input() cardEnter = () => {};
  get isTrackPages() {
    return this.wbsService.isTrackPages && this.source === Entry.card;
  }

  cardExecutionStatusInfo: any = {};
  Entry = Entry;
  _item;
  componentId = UUID.UUID();
  constructor(
    public wbsService: DynamicWbsService,
    public addSubProjectCardService: AddSubProjectCardService,
    private translateService: TranslateService,
    public commonService: CommonService,
    public changeRef: ChangeDetectorRef,
    private taskWbsListService: TaskWbsListService,
    private athMessageService: AthMessageService,
    private projectPlanCardService: ProjectPlanCardV2Service
  ) {}

  ngOnInit() {}
  translatePccWord(val: string): string {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
  initCardExecutionStatus() {
    let text = '';
    const status = this.cardInfo.status || this.cardInfo.task_status;
    this.cardExecutionStatusInfo = {
      text,
      status,
      className: cardExecutionStatus[status],
      otherClassName: [],
      hidden: false,
      process: this.processHandler(this.cardInfo.complete_rate || 0),
    };
    switch (status) {
      case cardExecutionStatusCode.NOSTART:
        text = this.translatePccWord('未开始');
        this.cardExecutionStatusInfo.hidden = true;
        this.cardExecutionStatusInfo.process = 0;
        break;
      case cardExecutionStatusCode.ONGOING:
        text = this.translatePccWord('进行中');
        break;
      case cardExecutionStatusCode.DONE:
        text = !this.isTrackPages ? this.translatePccWord('已完成') : '';
        break;
      case cardExecutionStatusCode.DESIGNATEDCOMPLETION:
        text = this.translatePccWord('指定完成');
        // delete this.cardExecutionStatusInfo.process;
        break;
      case cardExecutionStatusCode.TIMEOUT:
        text = this.translatePccWord('暂停');
        // delete this.cardExecutionStatusInfo.process;
        break;
      case cardExecutionStatusCode.SIGNOFF:
        // 签核中按照进行中处理
        text = this.translatePccWord('签核中');
        // delete this.cardExecutionStatusInfo.process;
        break;
      default:
        break;
    }
    // 非进度追踪页面，不显示进度
    if (!this.isTrackPages) {
      delete this.cardExecutionStatusInfo.process;
    }
    // 未开始/进行中/签核中，且是超期状态，则显示为逾期
    if (
      (cardExecutionStatusCode.NOSTART === status ||
        cardExecutionStatusCode.ONGOING === status ||
        cardExecutionStatusCode.SIGNOFF === status) &&
      this.cardInfo.isOverdue &&
      this.isTrackPages
    ) {
      this.cardExecutionStatusInfo.className = cardExecutionStatus[cardExecutionStatusCode.LATE];
      this.cardExecutionStatusInfo.hidden = false;
    }
    this.cardExecutionStatusInfo.text = text;
  }

  private processHandler(rate) {
    if (rate < 1) {
      return rate * 100;
    }
    return rate;
  }
}
