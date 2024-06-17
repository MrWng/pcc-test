import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { DynamicFormLayoutService } from '@athena/dynamic-core';
import { CommonService } from 'app/implementation/service/common.service';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { LoadingModalService} from './loading-modal.service';

@Component({
  selector: 'app-loading-modal',
  templateUrl: './loading-modal.component.html',
  styleUrls: ['./loading-modal.component.less'],
  providers: [LoadingModalService],
})
export class LoadingModalComponent implements OnInit, OnDestroy {

  @ViewChild('tplContent') tplContent: TemplateRef<any>;

  private refModal: NzModalRef;

  constructor(
    private http: HttpClient,
    public commonService: CommonService,
    protected layoutService: DynamicFormLayoutService,
    protected elementRef: ElementRef,
    private modalService: NzModalService,
  ) {}

  ngOnInit() {}

  ngOnDestroy(): void {
    this.closeLoadingModal();
  }

  // 打开loading蒙层
  private createLoadingModal(): void {
    this.refModal = this.modalService.create({
      nzWrapClassName: 'pcc-loading-modal-wrap',
      nzClassName: 'pcc-loading-modal',
      nzTitle: '',
      nzContent: this.tplContent,
      nzFooter: null,
      nzCentered: true,
      nzMask: true,
      nzMaskClosable: false,
      nzClosable: false,
      nzKeyboard: false,
      nzOkDisabled: true,
      nzCancelDisabled: true
    });
  }

  // 关闭loading蒙层
  private closeLoadingModal(): void {
    if (this.refModal) {
      this.refModal.close(); // 关闭
      this.refModal.destroy(); // 销毁对话框
    }
  }

}
