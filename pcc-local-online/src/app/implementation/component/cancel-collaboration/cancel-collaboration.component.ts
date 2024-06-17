import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { TranslateService } from '@ngx-translate/core';
import { DynamicWbsService } from '../wbs/wbs.service';
import { CancelCollaborationService } from './cancel-collaboration.service';
import { Subscription } from 'rxjs';
import { AthMessageService } from '@athena/design-ui';

@Component({
  selector: 'app-cancel-collaboration',
  templateUrl: './cancel-collaboration.component.html',
  styleUrls: ['./cancel-collaboration.component.less'],
  providers: [CancelCollaborationService, AthMessageService],
})
export class CancelCollaborationComponent implements OnInit, OnDestroy {
  @Input() sourceData;
  @Input() nzPopover;
  @Input() loadingModal: any; // loading蒙层组件
  @Input() needRefreshDirectly: boolean = false; // 取消协同后是否需要直接刷新数据
  // source不赋值，默认用于项目基础维护页面；source='collaborate',用于协同计划排定任务卡内
  @Input() source: string;
  // athType默认text类型，用于wbs卡片和列表项；default用于协同计划排定任务卡内，以按钮形式呈现
  @Input() athType: string = 'text';
  @Input() btnSize = 'default';
  @Input() isDisabled: boolean = false;
  @Output() confirmVisibleChange = new EventEmitter<any>();
  @Output() cancelSuccess = new EventEmitter<any>();
  @Output() cancelFullFail = new EventEmitter<any>();
  @Output() clickCancelCollaboration = new EventEmitter<any>();
  confirmVisible: boolean = false;
  cancelIsSuccess: boolean = false;
  loading: boolean = false;
  btnText: string = this.translateService.instant('dj-pcc-取消协同');
  isOk: boolean = false;
  sub: Subscription = new Subscription();
  constructor(
    public wbsService: DynamicWbsService,
    public cancelCollaborationService: CancelCollaborationService,
    private translateService: TranslateService,
    public commonService: CommonService,
    public changeRef: ChangeDetectorRef,
    public elementRef: ElementRef,
    private athMessage: AthMessageService
  ) {}
  ngOnInit(): void {
    this.loading = !!this.wbsService['CancelCollaborationBtnLoading'];
    // 成功并且刷新完数据后操作
    const s = this.wbsService.pageChange.subscribe(() => {
      this.loading = this.wbsService['CancelCollaborationBtnLoading'] = false;
      this.confirmVisibleChangeHandler(this.confirmVisible);
    });
    this.sub.add(s);
  }
  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
  cancelCollaborationClick() {
    this.clickCancelCollaboration.emit();
  }
  async cancelCollaborationConfirm(): Promise<any> {
    try {
      if (this.loadingModal && this.source === 'collaborate') {
        // 打开loading蒙层
        this.loadingModal.createLoadingModal();
      }
      this.loading = this.wbsService['CancelCollaborationBtnLoading'] = true;
      const { inCollaboration, isOk } = await this.cancelCollaborationService.hasTaskCard(
        this.sourceData
      );
      if (!isOk) {
        const info =
          this.source === 'collaborate' || !inCollaboration
            ? 'dj-pcc-协同排定任务已提交或已取消！'
            : 'dj-pcc-协同排定任务尚未下发成功，请稍后再试！';
        this.athMessage.warning(this.translateService.instant(info));
        this.loading = this.wbsService['CancelCollaborationBtnLoading'] = false;
        this.isOk = false;
        this.confirmVisible = false;
        this.changeRef.markForCheck();
        if (this.source === 'collaborate') {
          setTimeout(() => {
            this.cancelFullFail.emit();
          }, 500);
        } else {
          this.cancelFullFail.emit({
            inCollaboration,
            isOk,
            source: this.source,
          });
        }
        return;
      }
      await this.cancelCollaborationService
        .clearCollaborationCard(this.sourceData.project_no, this.sourceData.task_no, false)
        .toPromise();
      this.isOk = true;
      this.confirmVisible = false;
      if (this.needRefreshDirectly) {
        this.wbsService.pageChange.next(true);
      }
      this.athMessage.success(this.translateService.instant('dj-pcc-取消协同成功'));
      this.wbsService['cancelCollaborationSuccessFlag'] = true;
      this.loading = false;
      this.cancelSuccess.emit();
    } catch (error) {
      this.cancelFullFail.emit({
        source: this.source,
        isOk: false,
        inCollaboration: true,
      });
      this.confirmVisible = false;
      this.loading = this.wbsService['CancelCollaborationBtnLoading'] = false;
      this.isOk = false;
      this.confirmVisibleChangeHandler(this.confirmVisible);
    }
  }
  cancelCollaborationCancel() {
    this.confirmVisible = false;
    this.confirmVisibleChangeHandler(this.confirmVisible);
  }
  confirmVisibleChangeHandler(e) {
    this.confirmVisible = e;
    if (!this.loading) {
      this.confirmVisibleChange.emit(e);
    }
  }
}
