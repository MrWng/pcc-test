import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DwUserService } from '@webdpt/framework/user';
import { UploadAndDownloadService } from 'app/implementation/service/upload.service';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { DmcService, UploadFile } from '@athena/design-ui/src/components/upload';
import { DynamicWbsService } from '../../../wbs/wbs.service';
import { AddSubProjectCardService } from '../../add-subproject-card.service';
import { MyUploadService } from './upload.service';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.less'],
  providers: [DmcService, MyUploadService]
})
export class UploadFileComponent implements OnInit {

  @Input() attachmentData: any[] = [];
  @Output() changeSubcomponents = new EventEmitter<any>();

  userId: '';
  previewVisible: boolean = false;
  previewImage = '';

  constructor(
    private translateService: TranslateService,
    protected changeRef: ChangeDetectorRef,
    public addSubProjectCardService: AddSubProjectCardService,
    private messageService: NzMessageService,
    private userService: DwUserService,
    public wbsService: DynamicWbsService,
    public uploadService: UploadAndDownloadService,
    private modal: AthModalService,
    protected myUploadService: MyUploadService,
  ) { }

  ngOnInit() {
    this.userId = this.userService.getUser('userId');
  }

  beforeUpload = (file: NzUploadFile, fileList: UploadFile[]): boolean => {
    if (this.attachmentData.length >= 3) {
      return false;
    }
    if (this.addSubProjectCardService.filterSize(file.size) > 50) {
      this.messageService.error(
        this.translateService.instant(`dj-default-上传文件大小不超过50MB`)
      );
      return false;
    } else {
      return true;
    }
  }
  importData(event): void {
    // if (event.type === 'removed') {
    //   let index = null;
    //   this.attachmentData.forEach((item, idx) => {
    //     if (item.id === event.file.id) {
    //       index = idx;
    //     }
    //   })
    //   this.attachmentData.splice(index, 1);
    //   this.changeRef.markForCheck();
    //   return;
    // }
    const file: any = event.file;
    if (file && file.id) {
      this.attachmentData.forEach((item, index) => {
        if (item.id === file.id) {
          this.attachmentData[index] = {
            ...file,
            category: 'manualAssignmentSampleDelivery',
            categoryId: 'manualAssignmentSampleDelivery',
            upload_user_name: this.userService.getUser('userName'),
            upload_user_id: this.userService.getUser('userId'),
            create_date: moment(new Date()).format('YYYY/MM/DD HH:mm:ss'),
            lastModified: moment(new Date(file.lastModified)).format('YYYY/MM/DD HH:mm:ss'),
            row_data:
              this.wbsService.project_no +
              ';' +
              (this.addSubProjectCardService.currentCardInfo as any).task_no,
          }
        }
      })
      // const info = {
      //   key: file.id,
      //   uid: file.id,
      //   id: file.id,
      //   name: file.name,
      //   category: 'manualAssignmentSampleDelivery',
      //   categoryId: 'manualAssignmentSampleDelivery',
      //   upload_user_name: this.userService.getUser('userName'),
      //   upload_user_id: this.wbsEentrance === WbsEentrance.ProjectTemplateMaintenance ? '' : this.userService.getUser('userId'),
      //   size: file.size,
      //   status: file.status,
      //   url: file.url,
      //   percent: 100,
      //   showDownload: true,
      //   create_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      //   lastModified: moment(new Date(file.lastModified)).format('YYYY-MM-DD HH:mm:ss'),
      //   row_data:
      //     this.wbsService.project_no +
      //     ';' +
      //     (this.addSubProjectCardService.currentCardInfo as any).task_no,
      // };
      // this.attachmentData.push(info);
      // this.changeRef.markForCheck();
    }
    this.changeSubcomponents.emit(this.attachmentData);
    // const fileList: FileList = event.fileList;
    // if (fileList && fileList.length > 0 && this.attachmentData.length < 3) {
    //   const file: File = event.file;
    //   if (this.addSubProjectCardService.filterSize(file.size) > 10) {
    //     this.messageService.error(
    //       this.translateService.instant(`dj-default-上传文件大小不超过50MB`)
    //     );
    //     return;
    //   }
    //   this.isSpinning = true;
    //   this.uploadService.upload(file, 'Athena').subscribe((res) => {
    //     if (res.status === 'success') {
    //       event.target.value = '';
    //       this.isSpinning = false;
    //       const info = {
    //         id: res.fileId,
    //         name: file.name,
    //         category: 'manualAssignmentSampleDelivery',
    //         categoryId: 'manualAssignmentSampleDelivery',
    //         upload_user_name: this.userService.getUser('userName'),
    //         upload_user_id: this.wbsEentrance === WbsEentrance.ProjectTemplateMaintenance ? '' : this.userService.getUser('userId'),
    //         size: file.size,
    //         create_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    //         row_data:
    //           this.wbsService.project_no +
    //           ';' +
    //           (this.addSubProjectCardService.currentCardInfo as any).task_no,
    //       };
    //       this.attachmentData.push(info);
    //       this.changeRef.markForCheck();
    //     }
    //   });
    // }
  }
  dmcSettings = {
    dmcUrl: this.addSubProjectCardService.dmcUrl,
    dirName: 'athena',
    username: 'Athena',
    password: 'Athena',
    bucketName: 'Athena'
  }
  getFileName(file: any): string {
    return file.name.replace(/\.[^/.]+$/, '')
  }
  getFileIcon(file: any): any {
    const fileTypes = {
      image: ['jpg', 'jpge', 'JPG', 'png', 'webp', 'png', 'gif', 'fit', 'bmp'],
      archive: ['zip', 'rar', '7z'],
    };
    const iamgeExtens = fileTypes.image.map((item) => ({
      name: item,
      icon: 'icon-tupiangeshi',
      color: '#A9BDFF',
    }));
    const archiveExtens = fileTypes.archive.map((item) => ({
      name: item,
      icon: 'icon-yasuobaoleixing',
      color: '#B397EC',
    }));
    const extensions = [...iamgeExtens, ...archiveExtens];
    const nameList = file.name.split('.');
    const extensionName = nameList[nameList.length - 1];
    const filterRes = extensions.find((item) => item.name === extensionName);
    if (filterRes) {
      return { icon: filterRes.icon, color: filterRes.color };
    } else {
      return { icon: 'icon-qitageshi', color: '#FF9800' };
    }
  }
  previewFile = (file: UploadFile): void => {
    const index = file.name.lastIndexOf('.');
    const ext = file.name.substr(index + 1);
    if (this.addSubProjectCardService.isAssetTypeAnImage(ext)) {
      const imageList: any[] = [];
      let index = 0;
      this.attachmentData.forEach((fileItem): void => {
        if (this.addSubProjectCardService.isAssetTypeAnImage(fileItem.name.substr(fileItem.name.lastIndexOf('.') + 1))) {
          imageList.push({
            ...fileItem
          });
        }
        if (file.id === fileItem.id) {
          index = imageList.length - 1;
        }
      });
      if (imageList.length > 0) {
        this.myUploadService.showImageViewer(imageList, index);
      }
    } else {
      const url = this.addSubProjectCardService.dmcUrl;
      const previewUrl = `${url}/api/dmc/v2/file/Athena/online/preview/${file.id}`;
      window.open(previewUrl);
      // this.downLoad(file);
    }
  }

  deleteFile = (file: UploadFile): void => {
    this.modal.confirm({
      nzContent: this.translateService.instant('dj-default-是否删除该文件？'),
      nzOkText: this.translateService.instant('dj-default-确定'),
      nzOkType: 'primary',
      nzCancelText: this.translateService.instant('dj-default-取消'),
      // nzClassName: 'upload-modal',
      nzOnOk: (): void => {
        let index = null;
        this.attachmentData.forEach((item, idx) => {
          if (item.id === file.id) {
            index = idx;
          }
        })
        this.attachmentData.splice(index, 1);
        this.changeRef.markForCheck();
      },
    });
  }

  downLoad = (file: UploadFile): void => {
    this.uploadService.download('Athena', file.id, file.name).subscribe((blobFile) => { });
  }

}
