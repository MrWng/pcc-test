import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicTableModel,
  DynamicUserBehaviorCommService,
} from '@athena/dynamic-core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  CommonService,
  Entry,
} from 'app/implementation/service/common.service';
import { UploadAndDownloadService } from '../../../../service/upload.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DynamicWbsService } from '../../wbs.service';

interface Person {
  label: string;
  name: string;
}

@Component({
  selector: 'app-upload',
  templateUrl: './uploadList.component.html',
  styleUrls: ['./uploadList.component.less'],
})
export class UploadComponent implements OnInit {
  @Input() source: Entry = Entry.card;
  // wbs入口
  Entry = Entry;

  downloadId: string = '';
  uploadLoading: Boolean = false;
  isVisible: Boolean = false;
  isVisibleError: Boolean = false;
  isShowClose: Boolean = false;
  isShowCancel = null;
  isShowPage: Boolean = false;
  errorList: Person[] = [];

  public dynamicGroup: FormGroup;
  public dynamicLayout: DynamicFormLayout;
  public dynamicModel: DynamicTableModel[];
  downLoadCode: any;
  importDataCode: string;

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    protected translateService: TranslateService,
    public commonService: CommonService,
    public uploadService: UploadAndDownloadService,
    public messageService: NzMessageService,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
    public wbsService: DynamicWbsService
  ) {
    this.downLoadCode =
      'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON008';
    this.importDataCode =
      'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON009';
  }

  ngOnInit() {}

  downLoad() {
    if(this.source === Entry.card && !this.wbsService.projectInfo.project_type_no){
      return ;
    }
    const params = {
      project_no: this.wbsService.project_no,
      task_property: this.source === Entry.maintain ? '2' : '1',
    };
    this.commonService
      .getInvData('project.task.download.info.get', params)
      .subscribe((res: any): void => {
        this.downloadId = res.data.fild_id;
        this.getFieldId();
      });
  }

  getFieldId(): void {
    this.uploadService
      .download('Athena', this.downloadId, this.wbsService.project_no + '.xlsm')
      .subscribe((blobFile) => {});
  }

  upload() {
    if((this.wbsService.projectInfo?.project_status === '10' &&
        !this.wbsService.projectInfo.project_type_no) ||
      this.wbsService.hasCollaborationCard ||
      !this.wbsService.editable){
      return ;
    }
    if (!this.uploadLoading) {
      this.isVisible = true;
    }
  }

  importData(event): void {
    this.uploadLoading = true;
    const fileList: FileList = event.target.files;
    if (fileList.length) {
      // 清理修改任务卡片后的标记 *
      sessionStorage.removeItem('hasEditFromTaskNoArr' + this.wbsService.project_no);
      const file: File = fileList[0];
      this.uploadService.upload(file, 'Athena').subscribe((res) => {
        if (res.status === 'success') {
          event.target.value = '';
          this.changeWbs(res.fileId);
        }
      });
    }
  }
  changeWbs(fileId) {
    const params = {
      project_no: this.wbsService.project_no,
      category_id: fileId,
      task_property: this.source === Entry.maintain ? '2' : '1',
      wbs_first_budget: !!this.wbsService.projectInfo.wbs_first_budget, // s10: 从WBS发起初版预算
    };
    this.commonService
      .getInvData('project.task.import.info.process', params)
      .pipe(
        catchError((res) => {
          this.uploadLoading = false;
          this.changeRef.markForCheck();
          return of(res.error);
        })
      )
      .subscribe((res: any): void => {
        this.uploadLoading = false;
        if (res.code === 0) {
          if (res.data.project_info && res.data.project_info?.length) {
            this.errorList = res.data.project_info;
            this.isVisibleError = true;
            this.changeRef.markForCheck();
          } else {
            this.isVisible = false;
            this.wbsService.pageChange.next(true);
            this.wbsService.$checkProportion.next(false);
            this.messageService.success(this.translateService.instant('dj-pcc-导入成功'));
          }
        }
      });
  }

  handleCancel() {
    this.isVisible = false;
  }

  handleOk() {
    this.isVisibleError = false;
  }

  translatePccWord(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
