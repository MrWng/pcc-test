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
import { CommonService } from 'app/implementation/service/common.service';
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
  @Output() confirmVisibleChange = new EventEmitter<any>();
  @Output() cancelSuccess = new EventEmitter<any>();
  @Output() cancelFullFail = new EventEmitter<any>();
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
  async cancelCollaborationConfirm(): Promise<any> {
    try {
      this.loading = this.wbsService['CancelCollaborationBtnLoading'] = true;
      const isOk = await this.cancelCollaborationService.hasTaskCard(this.sourceData);
      if (!isOk) {
        this.athMessage.warning(
          this.translateService.instant('dj-pcc-协同排定任务尚未下发成功，请稍后再试！')
        );
        this.loading = false;
        this.changeRef.markForCheck();
        return;
      }
      await this.cancelCollaborationService
        .clearCollaborationCard(this.sourceData.project_no, this.sourceData.task_no, false)
        .toPromise();
      this.isOk = true;
      this.confirmVisible = false;
      this.athMessage.success(this.translateService.instant('dj-pcc-取消协同成功'));
      this.cancelSuccess.emit();
    } catch (error) {
      this.cancelFullFail.emit();
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
