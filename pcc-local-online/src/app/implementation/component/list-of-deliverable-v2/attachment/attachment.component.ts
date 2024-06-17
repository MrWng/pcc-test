import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AcBaseCellComponent } from '@app-custom/ui/ac-table-cell';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { AttachmentService } from './attachment.service';
import { DwFormArray, DwFormGroup } from '@athena/dynamic-core';
import { DwUserService } from '@webdpt/framework';
import * as moment from 'moment';
import { fileKeyMap } from '../config';
import { ICellRendererParams } from 'ag-grid-community';
import { AthMessageService, AthModalService } from '@athena/design-ui';
import { DynamicWbsService } from '../../wbs/wbs.service';
import { ListOfDeliverableV2Service } from '../list-of-deliverable.service';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { UploadAndDownloadService } from 'app/implementation/service/upload.service';
import { AcModalModule, AcModalService } from '@app-custom/ui/modal';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DmcUploadService } from '@athena/dynamic-ui';

@Component({
  selector: 'app-attachment',
  templateUrl: './attachment.component.html',
  styleUrls: ['./attachment.component.less'],
  providers: [AthMessageService, AthModalService],
})
export class AttachmentComponent extends AcBaseCellComponent implements OnInit, OnChanges {
  @Input() disabled: boolean = true;
  @Input() fileCount = 3;
  @Input() fileSize = 1024 * 1024 * 50; // 默认50m
  @Input() matchPath: Set<string> = new Set();
  @Input() source: Entry = Entry.card;
  @Input() fileChanged = (e) => {};
  @ViewChild('acUpload') acUpload;

  constructor(
    public commonService: CommonService,
    public changeRef: ChangeDetectorRef,
    public elementRef: ElementRef,
    public attachmentService: AttachmentService,
    protected userService: DwUserService,
    private athMessageService: AthMessageService,
    public wbsService: DynamicWbsService,
    public listOfDeliverableV2Service: ListOfDeliverableV2Service,
    private modal: AthModalService,
    private uploadAndDownloadService: DmcUploadService,
    private zone: NgZone
  ) {
    super(elementRef, changeRef);
  }
  fileList = [];
  rowGroup: any = {};
  colId = '';
  taskId = '';
  isPLMFile = false;
  beforeUpload = this._beforeUpload.bind(this);
  fileErrorHandler = this._fileErrorHandler.bind(this);
  PLMPreviewFile = this.PLMPreviewFileHandler.bind(this);
  PLMDownloadFile = this.PLMDownloadFileHandler.bind(this);
  removeFile = this.removeFileHandler.bind(this);
  allRemoveFiles = this.allRemoveFilesHandler.bind(this);
  /**
   * 钩子函数，用来获取字段的值
   * @param params
   */
  athOnInit(params: ICellRendererParams) {
    super.athOnInit(params);

    let { data } = params;
    if (data instanceof DwFormGroup || data instanceof FormGroup) {
      data = data.getRawValue();
    }
    this.rowGroup = data;
    this.setColId();
    this.setFileSize();
    if (this.colId === 'manual_assignment_delivery_plm') {
      this.isPLMFile = true;
    }
    const condition =
      this.wbsService.editable && this.listOfDeliverableV2Service.source !== Entry.collaborate;
    const isEdit = condition ? true : false;
    this.disabled =
      !isEdit || // 1.是否可编辑
      this.isPLMFile || // 2.PLM文件不可编辑
      this.disabled || // 3.传递props的disabled为true不可编辑
      !(this.rowGroup[this.colId] && this.rowGroup[this.colId].length); // 没附件不可编辑
    this.fileList = this.attachmentService.fileFormate(
      this.rowGroup[this.colId] || [],
      this.isPLMFile
    );
    this.taskId = this.fileList[0]?.task_id;
  }

  ngOnInit() {
    document.body.classList.add('list-of-deliverable-v2');
  }
  ngOnChanges(changes) {
    document.body.classList.remove('list-of-deliverable-v2');
  }
  setFileSize() {
    const fileMaxSizeFlag = ['manualAssignmentDelivery'];
    this.fileSize = fileMaxSizeFlag.includes(fileKeyMap[this.colId])
      ? 1024 * 1024 * 100
      : this.fileSize;
  }
  setColId() {
    const compoundField = [...this.matchPath] || [];
    while (compoundField.length) {
      const curField = compoundField.pop();
      if (this.rowGroup[curField] && this.rowGroup[curField].length) {
        return (this.colId = curField);
      }
    }
    return (this.colId = this.data.colId);
  }
  uploadChangeChange(e) {
    if (e.type === 'success') {
      this.setAttachmentData(e);
      this.fileChanged({
        type: 'add',
        file: e.file,
        fileList: e.fileList,
        rowData: this.rowGroup,
      });
      return;
    }

    if (e.type === 'removed') {
      this.setAttachmentData(e);
      this.fileChanged({
        type: 'delete',
        removeFiles: [e.file],
        fileList: e.fileList,
        rowData: this.rowGroup,
      });
      return;
    }
  }
  private setAttachmentData({ file, fileList }) {
    file.category = fileKeyMap[this.colId];
    file.categoryId = file.categoryId || file.category_id || file.id;
    file.upload_user_id = this.userService.getUser('userId');
    file.upload_user_name = this.userService.getUser('userName');
    file.create_date = moment(file.lastModifiedDate).format('YYYY-MM-DD HH:mm:ss');
    file.projectId = 'projectCenterConsole_userProject';
    file.task_id = this.taskId || file.task_id;
    const projectNo = this.rowGroup?.['project_no'],
      taskNo = this.rowGroup?.['task_no'];
    let rowDataKeys = '';
    if (projectNo && taskNo) {
      rowDataKeys = projectNo + ';' + taskNo + ';';
    } else if (projectNo) {
      rowDataKeys = projectNo + ';';
    } else if (taskNo) {
      rowDataKeys = projectNo + ';';
    }
    file.row_data = rowDataKeys;
    const fileInFileList = fileList.find(
      (item) => item.id === file.id && item.name === file.name && item.dirId === file.dirId
    );
    // eslint-disable-next-line no-unused-expressions
    fileInFileList && Object.assign(fileInFileList, file);
    this.rowGroup[this.colId] = this.fileList;
  }
  /**
   * 附件上传前置校验
   */
  _beforeUpload(file, fileList) {
    if (this.fileList.length > 0 && this.fileList.some((item) => item.name === file.name)) {
      this.athMessageService.error(
        this.commonService.translatePccWord('已存在相同附件名的附件，请修改后重新上传')
      );
      return false;
    }
    if (file.size >= this.fileSize) {
      this.athMessageService.error(
        this.commonService.translatePccWord('附件大小超过限制', {
          n: this.fileSize / (1024 * 1024),
        })
      );
      return false;
    }
    if (this.fileList.length < this.fileCount) {
      this.listOfDeliverableV2Service.sendOutputEvent({
        type: 'loading',
        value: true,
      });
    }
    return true;
  }
  _fileErrorHandler() {}
  removeFiles = [];
  allRemoveFilesHandler(e) {
    this.removeFiles = e.slice();
    this.startRemoveFile(2);
    return false;
  }
  removeFileHandler(file) {
    this.removeFiles.push(file);
    this.startRemoveFile(1);
    return false;
  }
  private startRemoveFile(type = 1) {
    this.zone.run(() => {
      this.modal.confirm({
        nzContent: this.commonService.translatePccWord(
          type === 1 ? '是否删除该文件' : '是否删除全部文件'
        ),
        nzOnOk: () => {
          this.removeFilesByApi();
        },
        nzOnCancel: (): void => {
          this.removeFiles = [];
        },
      });
    });
  }

  private async removeFilesByApi() {
    try {
      this.listOfDeliverableV2Service.sendOutputEvent({
        type: 'loading',
        value: true,
      });
      const fileIdArr = this.removeFiles.map((item) => item.id);
      const { category } = this.removeFiles[0] || {};
      const isOk = await this.attachmentService.checkFile(category, this.rowGroup);
      if (!isOk) {
        this.listOfDeliverableV2Service.sendOutputEvent({
          type: 'loading',
          value: false,
        });
        return;
      }
      await this.uploadAndDownloadService
        .deleteFile(this.commonService.uploadDmcSettings.bucketName, fileIdArr)
        .toPromise();
      this.removeFiles.forEach((file) => {
        this.fileList = this.fileList.filter((item) => item.id !== file.id);
        this.setAttachmentData({ file, fileList: this.fileList });
      });
      this.fileChanged({
        type: 'delete',
        removeFiles: this.removeFiles.slice(),
        fileList: this.fileList,
        rowData: this.rowGroup,
      });
      this.removeFiles = [];
      this.changeRef.markForCheck();
    } catch (error) {
      console.error(error.message);
    }
  }

  async PLMPreviewFileHandler(file): Promise<void> {
    const params = {
      doc_info: [
        {
          type: '0', // 预览
          deliverable_no: file.delivery_no,
        },
      ],
    };

    const doc_info = await this.attachmentService.project_task_delivery_enclosure_data_get(params);
    if (doc_info?.code === '0' && doc_info?.deliverable_attachment_link) {
      window.open(doc_info?.deliverable_attachment_link);
    } else {
      const err =
        doc_info?.code === '4'
          ? this.commonService.translatePccWord('交付物正在上传')
          : doc_info?.code === '3'
          ? this.commonService.translatePccWord('交付物已删除')
          : this.commonService.translatePccWord('交付物不存在');
      this.athMessageService.error(err);
    }
  }
  async PLMDownloadFileHandler(file): Promise<void> {
    const params = {
      doc_info: [
        {
          type: '1', // 下载
          deliverable_no: file.delivery_no,
        },
      ],
    };
    const doc_info = await this.attachmentService.project_task_delivery_enclosure_data_get(params);
    if (
      doc_info?.code === '0' &&
      doc_info?.deliverable_no &&
      doc_info?.token &&
      doc_info?.deliverable_attachment_link
    ) {
      this.attachmentService.downloadMultiUrl(doc_info, file.delivery_name).subscribe((res) => {});
    } else {
      const err =
        doc_info?.code === '4'
          ? this.commonService.translatePccWord('交付物正在上传')
          : doc_info?.code === '3'
          ? this.commonService.translatePccWord('交付物已删除')
          : this.commonService.translatePccWord('交付物不存在');
      this.athMessageService.error(err);
    }
  }

  onFileListChange(fileList: any) {
    this.fileList = fileList;
  }
}
