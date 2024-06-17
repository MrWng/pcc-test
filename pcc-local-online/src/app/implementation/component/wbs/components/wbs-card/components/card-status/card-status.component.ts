import { Component, OnInit, Input, ChangeDetectorRef, NgZone } from '@angular/core';
import { isEmpty } from '@athena/design-ui';
import { cardExecutionStatusCode, cardStatusId, setCardStatus } from '../card-status.config';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
import { TranslateService } from '@ngx-translate/core';
import { WbsCardService } from '../../wbs-card.service';

@Component({
  selector: 'app-card-status',
  templateUrl: './card-status.component.html',
  styleUrls: ['./card-status.component.less'],
})
export class CardStatusComponent implements OnInit {
  @Input() mode: string = '1'; /*  1 - 简洁模式 2 - 正常 */
  @Input() sourceRealy = '';
  @Input() source: Entry = Entry.card;
  @Input() get cardInfo() {
    return this._item;
  }
  set cardInfo(val: any) {
    if (isEmpty(val)) {
      return;
    }
    this._item = val;
    this.initCardStatus();
  }
  get isTrackPages() {
    return this.wbsService.isTrackPages && this.source === Entry.card;
  }
  _item;
  cardStatusInfo = [];
  inCollaboration: boolean = false;
  needHide = false;
  constructor(
    public wbsService: DynamicWbsService,
    public commonService: CommonService,
    public changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private wbsCardService: WbsCardService,
    private zone: NgZone
  ) {}

  ngOnInit() {}
  initCardStatus() {
    this.cardStatusInfo = [];
    this.deliverablesTagHandler();
    this.changeTagHandler();
    this.synergizingTagHandler();
    this.deliveredTagHandler();
    this.needApproveTagHandler();
    this.milestoneTagHandler();
    this.needHide = this.cardStatusInfo.every((item) => item.hidden);
  }
  /**
   * 处理交付物状态tag
   */
  private deliverablesTagHandler() {
    if (!this.isTrackPages) {
      if (this.cardInfo.is_attachment) {
        this.cardStatusInfo.push(
          setCardStatus(this.translateService.instant('dj-pcc-需交付物'), cardStatusId.DELIVERABLES)
        );
      }
      return;
    }
    if (
      (!this.cardInfo.children || !this.cardInfo.children.length) &&
      this.cardInfo.attachment_status
    ) {
      this.cardInfo.attachment_status === '1'
        ? this.cardStatusInfo.push(
            setCardStatus(
              this.translateService.instant('dj-pcc-需交付物'),
              cardStatusId.DELIVERABLES
            )
          )
        : this.cardStatusInfo.push(
            setCardStatus(
              this.translateService.instant('dj-pcc-已有交付物'),
              cardStatusId.DELIVERABLES_ARE_ALREADY_AVAILABLE
            )
          );
    }
  }
  /**
   * 处理需签核状态tag
   */
  private needApproveTagHandler() {
    const status = this.cardInfo.status || this.cardInfo.task_status;
    if (status === cardExecutionStatusCode.SIGNOFF) {
      this.cardStatusInfo.push(
        setCardStatus(this.translateService.instant('dj-pcc-签核中'), cardStatusId.SIGN_OFF)
      );
      return;
    }

    if (!this.cardInfo.is_approve) {
      return;
    }

    if (status === cardExecutionStatusCode.DONE) {
      this.cardStatusInfo.push(
        setCardStatus(this.translateService.instant('dj-pcc-已签核'), cardStatusId.SIGNED_OFF)
      );
      return;
    }
    this.cardStatusInfo.push(
      setCardStatus(this.translateService.instant('dj-pcc-需签核'), cardStatusId.SIGN_OFF_REQUIRED)
    );
  }

  /**
   * 处理变更状态tag
   * !根据后端接口控制
   */
  private changeTagHandler() {
    // 项目变更签核标记
    if (this.sourceRealy === Entry.projectChangeSignOff) {
      this.cardStatusInfo.push(
        setCardStatus(
          this.translatePccWord('已变更'),
          cardStatusId.CHANGED,
          this.cardInfo.change_type !== '2'
        )
      );
      // 移到了card-head组件中
      // if (this.cardInfo.change_type === '1') {
      //   this.cardStatusInfo.push(setCardStatus('New', cardStatusId.NEW_ADD));
      // }
      return;
    }
    if (!this.wbsService.isNoPermission) {
      this.cardStatusInfo.push(
        setCardStatus(
          this.translatePccWord('已变更'),
          cardStatusId.CHANGED,
          this.hasEdit(this.cardInfo) ? false : !this.cardInfo.update_flag
        )
      );
    }
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
  /**
   * 处理协同中状态tag
   */
  private synergizingTagHandler() {
    if (this.wbsService['cancelCollaborationSuccessFlag']) {
      return;
    }
    if (this.cardInfo.isCollaborationCard && this.source === Entry.card && !this.isTrackPages) {
      this.cardStatusInfo.push(
        setCardStatus(this.translatePccWord('协同中'), cardStatusId.SYNERGIZING)
      );
      this.inCollaboration = true;
    }
  }
  /**
   * 处理已下发状态tag
   */
  private deliveredTagHandler() {
    if (this.isTrackPages && this.cardInfo.children && !this.cardInfo.children.length) {
      this.cardInfo.is_issue_task_card
        ? this.cardStatusInfo.push(
            setCardStatus(this.translatePccWord('已下发'), cardStatusId.DELIVERED)
          )
        : this.cardStatusInfo.push(
            setCardStatus(this.translatePccWord('未下发'), cardStatusId.NOT_DELIVERED)
          );
    }
  }

  /**
   * 处理里程碑状态
   */
  private milestoneTagHandler() {
    if (this.cardInfo.is_milepost) {
      this.cardStatusInfo.push(
        setCardStatus(this.translatePccWord('里程碑'), cardStatusId.MILESTONE)
      );
    }
  }

  translatePccWord(val: string, op = {}): string {
    return this.translateService.instant(`dj-pcc-${val}`, op);
  }
}
