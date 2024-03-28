import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  forwardRef,
} from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { Entry } from 'app/implementation/service/common.service';
import { UploadAndDownloadService } from '../../../../service/upload.service';
import { DwUserService } from '@webdpt/framework/user';
import * as moment from 'moment';
import { AddSubProjectCardService } from '../../../add-subproject-card/add-subproject-card.service';
import { DynamicCustomizedService } from 'app/implementation/service/dynamic-customized.service';
import { DynamicWbsService } from '../../wbs.service';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-pcc-upload-file',
  templateUrl: './upload-file.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PccUploadFileComponent),
      multi: true,
    },
  ],
})
export class PccUploadFileComponent implements OnInit {
  @Input() title: string = this.translateWordPcc('附件');
  @Input() reasonType;
  @Input() isSpinning = false;
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
  fileList: any[] = [];
  private onTouchedCallback: () => void = () => {};
  private onChangeCallback: (_: any) => void = () => {};

  ngOnInit(): void {}
  writeValue(val: any[] = []): void {
    this.fileList = val || [];
  }
  registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedCallback = fn;
  }

  filterSize(size) {
    return size / Math.pow(1024, 2);
  }

  importData(event): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0 && this.fileList.length < 3) {
      const file: File = fileList[0];
      if (this.filterSize(file.size) > 50) {
        this.messageService.error(
          this.translateService.instant(`dj-default-上传文件大小不超过50MB`)
        );
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
          this.onChangeCallback(this.fileList);
          this.changeRef.markForCheck();
        }
      });
    }
  }

  deleteFile(index) {
    this.fileList.splice(index, 1);
    this.onChangeCallback(this.fileList);
    this.changeRef.markForCheck();
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translateWordPcc(val: string): string {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
