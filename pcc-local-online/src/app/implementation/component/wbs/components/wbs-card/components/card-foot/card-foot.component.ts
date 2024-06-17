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
import {
  cardExecutionStatus,
  cardExecutionStatusCode,
  cardStatusId,
  errorStatusGen,
  primaryStatusGen,
  setCardStatus,
  successStatusGen,
  taskStatusGen,
  warningStatusGen,
} from '../card-status.config';
import { WbsCardService } from '../../wbs-card.service';
@Component({
  selector: 'app-card-foot',
  templateUrl: './card-foot.component.html',
  styleUrls: ['./card-foot.component.less'],
})
export class CardFootComponent implements OnInit {
  @Input() get cardInfo() {
    return this._item;
  }
  set cardInfo(val: any) {
    if (isEmpty(val)) {
      return;
    }
    this._item = val;
    this.taskName = this.wbsCardService.getTaskCategoryInfo(this.cardInfo, true);
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
  _item;
  Entry = Entry;
  get isTrackPages() {
    return this.wbsService.isTrackPages && this.source === Entry.card;
  }
  taskName = '';
  cardStatusInfo = [];
  inCollaboration: boolean = false;
  constructor(
    public wbsService: DynamicWbsService,
    public addSubProjectCardService: AddSubProjectCardService,
    private translateService: TranslateService,
    public commonService: CommonService,
    public changeRef: ChangeDetectorRef,
    private taskWbsListService: TaskWbsListService,
    private athMessageService: AthMessageService,
    private projectPlanCardService: ProjectPlanCardV2Service,
    private wbsCardService: WbsCardService
  ) {}

  ngOnInit() {}
  translatePccWord(val: string, op = {}): string {
    return this.translateService.instant(`dj-pcc-${val}`, op);
  }
}
