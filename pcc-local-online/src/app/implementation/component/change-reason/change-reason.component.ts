import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { Entry } from 'app/implementation/service/common.service';
import { UploadAndDownloadService } from '../../service/upload.service';
import { DwUserService } from '@webdpt/framework/user';
import * as moment from 'moment';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { DynamicCustomizedService } from 'app/implementation/service/dynamic-customized.service';
import { DynamicWbsService } from '../wbs/wbs.service';
@Component({
  selector: 'app-change-reason',
  templateUrl: './change-reason.component.html',
})
export class ChangeReasonComponent implements OnInit, AfterViewInit {
  @Input() title: string = '';
  @Input() contentInfo: string = '';
  @Input() isTextArea: boolean = false;
  @Input() showUploadFile: boolean = false;
  @Input() source: Entry = Entry.card;
  @Output() showChangeReason = new EventEmitter();
  @Output() cancelInput = new EventEmitter();
  @Output() confirmInput = new EventEmitter();
  constructor(
    private translateService: TranslateService,
    public message: NzMessageService,
    private messageService: NzMessageService,
    public uploadService: UploadAndDownloadService,
    private userService: DwUserService,
    private addSubProjectCardService: AddSubProjectCardService,
    protected changeRef: ChangeDetectorRef,
    private dynamicCustomizedService: DynamicCustomizedService,
    public wbsService: DynamicWbsService
  ) {}

  changeReasonVisible = false;
  changeReason: string = '';
  fileList: any[] = [];
  isSpinning: boolean = false;
  reasonType: string;
  reasonForLostOrderDynamicModel: any;
  // 光斯奥丢单原因
  reason_for_lost_order: string = 'A';
  ngOnInit(): void {
    this.initIndividualCaseComp();
  }
  ngAfterViewInit() {}

  /**
   * 初始化个案
   */
  initIndividualCaseComp() {
    const curTenantId = JSON.parse(window.sessionStorage.getItem('DwUserInfo')).tenantId;
    // 光斯奥丢单原因
    this.reasonForLostOrderDynamicModel = this.dynamicCustomizedService.getComponent({
      tenantIdComponent: curTenantId + '-reason-for-lost-order',
      _component: this,
    });
  }

  showModal(type?: string) {
    this.changeReasonVisible = true;
    this.reasonType = type;
    this.changeRef.markForCheck();
  }
  $antMessage;
  $antMessageStyleZIndex;
  nzAfterOpen() {
    if (!this.$antMessage) {
      this.$antMessage = document.querySelector('.ant-message')?.parentNode?.parentNode?.parentNode;
    }
    if (!this.$antMessage) {
      return;
    }
    this.$antMessageStyleZIndex = this.$antMessage.style.zIndex;
    this.$antMessage.style.zIndex = 'unset';
  }
  nzAfterClose() {
    if (!this.$antMessage) {
      return;
    }
    this.$antMessage.style.zIndex = this.$antMessageStyleZIndex;
    this.$antMessageStyleZIndex = '';
  }

  // 取消
  cancel() {
    this.cancelInput.emit();
    this.changeReason = '';
    this.fileList = [];
    this.changeReasonVisible = false;
    this.resetReasonForLostOrder();
  }
  resetReasonForLostOrder() {
    this.reason_for_lost_order = 'A';
  }
  // 确定，提交
  confirm() {
    if (!this.changeReason) {
      // 校验，必填提示信息
      if (this.isTextArea) {
        this.message.create('warning', this.translateService.instant('dj-pcc-请输入变更原因'));
      } else {
        this.message.create('warning', this.translateService.instant('dj-default-未检测到输入'));
      }
    } else if (this.reasonForLostOrderDynamicModel && !this.reason_for_lost_order) {
      this.message.create('warning', this.translateService.instant('dj-pcc-请选择丢单原因'));
    } else {
      // 提交
      if (this.showUploadFile) {
        // 有附件
        this.confirmInput.emit({ changeReason: this.changeReason, fileList: this.fileList });
        this.fileList = [];
      } else {
        // 没附件
        this.confirmInput.emit(this.changeReason);
      }
      this.changeReason = '';
      this.changeReasonVisible = false;
    }
  }

  filterSize(size) {
    return size / Math.pow(1024, 2);
  }
  importData(event): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0 && this.fileList.length < 3) {
      const file: File = fileList[0];

      if (this.fileList.some((item) => item.name === file.name)) {
        this.messageService.error(
          this.translateService.instant(`dj-pcc-已存在相同附件名的附件，请修改后重新上传`)
        );
        event.target.value = '';
        return;
      }

      if (this.filterSize(file.size) > 50) {
        this.messageService.error(
          this.translateService.instant(`dj-default-上传文件大小不超过50MB`)
        );
        event.target.value = '';
        return;
      }
      const categoryMap = {
        continueProject: 'pcc_project_status_change', // 继续项目
        suspend: 'pcc_project_status_change', // 暂停专案
        designated: 'pcc_project_status_change', // 指定结案
        closeProjectForNotDesign: 'pcc_project_status_change', // 结案
      };
      const category = categoryMap[this.reasonType] || 'pcc_wbs_planChanges';
      this.isSpinning = true;
      this.uploadService.upload(file, 'Athena').subscribe((res) => {
        if (res.status === 'success') {
          event.target.value = '';
          this.isSpinning = false;
          const info = {
            id: res.fileId,
            name: file.name,
            category: category, // 计划变更
            categoryId: category,
            upload_user_name: this.userService.getUser('userName'),
            upload_user_id: this.userService.getUser('userId'),
            size: file.size,
            create_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            row_data:
              (this.addSubProjectCardService.currentCardInfo?.project_no ||
                this.wbsService?.project_no) + ';',
          };
          this.fileList.push(info);
          this.changeRef.markForCheck();
        }
      });
    }
  }

  deleteFile(index) {
    this.fileList.splice(index, 1);
    this.changeRef.markForCheck();
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
