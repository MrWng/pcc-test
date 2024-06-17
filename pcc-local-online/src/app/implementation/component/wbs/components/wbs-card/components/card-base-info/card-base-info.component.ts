import { Component, OnInit, Input } from '@angular/core';
import { AthMessageService, isEmpty } from '@athena/design-ui';
import { WbsCardService } from '../../wbs-card.service';
@Component({
  selector: 'app-card-base-info',
  templateUrl: './card-base-info.component.html',
  styleUrls: ['./card-base-info.component.less'],
})
export class CardBaseInfoComponent implements OnInit {
  @Input() mode = '1'; /* 1 - 简介模式 2 - 普通 */
  @Input() get cardInfo() {
    return this._item;
  }
  showExecPeopleTooltip = false;
  set cardInfo(val: any) {
    if (isEmpty(val)) {
      return;
    }
    this._item = val;
    this.taskName = this.wbsCardService.getTaskCategoryInfo(this.cardInfo, true);
  }
  get hasInfo(): boolean {
    return this.showLiablePersonName || this.showExecutorName;
  }
  get showLiablePersonName(): boolean {
    if (
      this.cardInfo.children &&
      !this.cardInfo.children.length &&
      this.cardInfo.liable_person_name
    ) {
      return true;
    }
    return false;
  }
  get showExecutorName(): boolean {
    if (this.cardInfo.children && !this.cardInfo.children.length && this.taskMemberInfo) {
      return true;
    }
    return false;
  }
  get taskMemberInfo(): string {
    return (this.cardInfo.task_member_info || []).map((item) => item.executor_name).join('、');
  }
  private _item;
  taskName = '';
  constructor(private wbsCardService: WbsCardService) {}

  ngOnInit() {}
}
