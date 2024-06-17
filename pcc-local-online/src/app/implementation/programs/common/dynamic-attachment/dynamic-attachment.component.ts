import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  OnInit,
  Optional,
  Renderer2,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  DwFormGroup,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicUserBehaviorCommService,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { APP_SYSTEM_CONFIG, DwSystemConfigService } from '@webdpt/framework/config';
import { DwUserService } from '@webdpt/framework/user';
import {
  DmcUploadService,
  DynamicUploadComponent,
  MessageTipService,
  UploadFileItem,
  UploadService,
} from '@athena/dynamic-ui';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { PccDynamicDynamicAttachmentModel } from 'app/implementation/model/pcc-attachment/dynamic-attachment.model';
import { excelExt, imgExt, pdfExt, pptExt, wordExt, zipExt } from './fileType';

@Component({
  selector: 'app-dynamic-attachment',
  templateUrl: './dynamic-attachment.component.html',
  styleUrls: ['./dynamic-upload.component.less', './dynamic-attachment.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PccDynamicAttachmentComponent extends DynamicUploadComponent implements OnInit {
  @Input() model: PccDynamicDynamicAttachmentModel;

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected dmcUploadService: DmcUploadService,
    protected uploadService: UploadService,
    protected messageService: AthMessageService,
    protected messageTipService: MessageTipService,
    protected userService: DwUserService,
    protected translateService: TranslateService,
    protected renderer2: Renderer2,
    protected fb: FormBuilder,
    protected elementRef: ElementRef,
    protected modalService: AthModalService,
    protected configService: DwSystemConfigService,
    @Optional()
    @Inject(APP_SYSTEM_CONFIG)
    protected systemConfig: any,
    @Optional()
    @Inject(APP_SYSTEM_CONFIG)
    protected cannotIgnoreRulesService: any,
    protected userBehaviorCommService: DynamicUserBehaviorCommService
  ) {
    super(
      changeRef,
      layoutService,
      validationService,
      dmcUploadService,
      uploadService,
      messageService,
      messageTipService,
      userService,
      translateService,
      renderer2,
      fb,
      elementRef,
      configService,
      modalService,
      cannotIgnoreRulesService,
      userBehaviorCommService,
      systemConfig
    );
  }
  get fileIcon() {
    return 'iconexcel';
  }
  get btnLoading() {
    return this.group.get('loading')?.value || false;
  }

  getFileIcon(name) {
    const regex = /\.([a-zA-Z0-9]+)$/;
    const match = (name.match(regex)?.[1] || '').toLowerCase();
    if (excelExt.includes(match)) return 'iconexcel';
    if (imgExt.includes(match)) return 'iconjpg';
    if (pdfExt.includes(match)) return 'iconpdf16';
    if (wordExt.includes(match)) return 'iconword';
    if (zipExt.includes(match)) return 'iconrar';
    if (pptExt.includes(match)) return 'iconPPT';
    return 'iconqita';
  }
  /**
   * 检查文件是否可以上传
   * @param item 文件
   */
  checkCanUploadFile(): boolean {
    if (
      !this.model.disabled &&
      this.model.attribute?.uploadEnable &&
      (this.model.attribute?.fileCount === 0 ||
        this.fileList?.length < this.model.attribute?.fileCount)
    ) {
      return true;
    }
    return false;
  }
  checkCanDownloadFile(item: UploadFileItem): boolean {
    if (
      this.model.attribute?.readEnable &&
      this.model.attribute?.readCategory?.includes?.(item?.[this.fieldMapping.category])
    ) {
      return true;
    }
    if (this.model.attribute?.readEnable && this.model.attribute?.type === 'OUTER') {
      return true;
    }
    if (this.model.attribute?.['downloadEnable']) {
      return true;
    }
    return false;
  }
  isNotReadonly() {
    if (!this.model.disabled && this.model.attribute?.uploadEnable) {
      return true;
    }
    return false;
  }
  checkIsEmpty(): boolean {
    return this.fileList.length === 0;
  }
  // 只读状态下的placeholder
  readOnlyPlaceholder() {
    const str = `dj-pom-${this.model.headerName}`;
    return this.translateService.instant('dj-pcc-查看n', {
      n: this.translateService.instant(this.model.headerName),
    });
  }
}
