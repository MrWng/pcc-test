import { Component, OnInit, Input } from '@angular/core';
import { Entry } from 'app/implementation/service/common.service';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
import { setCardStatus, cardStatusId, cardExecutionStatusCode } from '../card-status.config';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, isEmpty } from '@athena/dynamic-core';

@Component({
  selector: 'app-card-overdue-tag',
  templateUrl: './card-overdue-tag.component.html',
  styleUrls: ['./card-overdue-tag.component.less'],
})
export class CardOverdueTagComponent implements OnInit {
  @Input()
  get cardInfo() {
    return this._item;
  }
  set cardInfo(val: any) {
    if (isEmpty(val)) {
      return;
    }
    this._item = val;
    this.setOverdueTagHandler();
  }
  private _item;
  // 逾期信息
  overdueInfo: any = {};
  constructor(public wbsService: DynamicWbsService, private translateService: TranslateService) {}

  ngOnInit() {}
  private setOverdueTagHandler() {
    const status = this.cardInfo.status || this.cardInfo.task_status;
    if (this.cardInfo.isOverdue) {
      this.overdueInfo = setCardStatus(
        this.translatePccWord('逾期n', {
          n: this.cardInfo.overdue_days,
        }),
        cardStatusId.N_DAYS_OVERDUE
      );
    }
  }
  translatePccWord(val: string, op = {}): string {
    return this.translateService.instant(`dj-pcc-${val}`, op);
  }
}
