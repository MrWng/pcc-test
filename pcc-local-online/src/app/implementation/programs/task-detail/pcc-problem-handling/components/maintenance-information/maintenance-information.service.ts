import { Injectable } from '@angular/core';
import { BaseDynamicCompBuilder } from 'app/implementation/class/DynamicCom';
import { DynamicFormService } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { PccProblemHandlingService } from '../../pcc-problem-handling.service';
import { CommonService } from 'app/implementation/service/common.service';
import { CreateDynamicFormCopService } from 'app/implementation/service/create-dynamic-form-cop.setvice';
import { CreateDynamicCopRulesService } from 'app/implementation/service/create-dynamic-cop-rules.service';
import { CreateDynamicTableCopService } from 'app/implementation/service/create-dynamic-table-cop.setvice';
import { UploadAndDownloadService } from 'app/implementation/service/upload.service';
import { DwUserService } from '@webdpt/framework';
import * as moment from 'moment';

@Injectable()
export class MaintenanceInformationService extends BaseDynamicCompBuilder {
  // 记录机制的content参数
  content: any;
  constructor(
    public commonService: CommonService,
    public createDynamicFormCopService: CreateDynamicFormCopService,
    public createDynamicCopRulesService: CreateDynamicCopRulesService,
    public formService: DynamicFormService,
    private translateService: TranslateService,
    public createDynamicTableCopService: CreateDynamicTableCopService,
    private pccProblemHandlingService: PccProblemHandlingService,
    public uploadService: UploadAndDownloadService,
    private userService: DwUserService
  ) {
    super(formService, createDynamicFormCopService, createDynamicTableCopService);
  }
  async formatAttachment(attachment: any[]): Promise<any> {
    if (!attachment || attachment.length === 0) {
      return;
    }
    return this.uploadService
      .getFileUrl(
        'Athena',
        attachment.map((item) => item.id)
      )
      .toPromise()
      .then((res) => {
        attachment.forEach((item, index) => {
          Object.assign(item, {
            uid: item.id,
            status: 'done',
            lastModified: new Date(item.create_date).getTime(),
            url: res[index],
          });
        });
      });
  }
  deserializeAttachment(file: any) {
    return {
      category: 'pccUploadAttachment',
      categoryId: 'pccUploadAttachment',
      upload_user_name: this.userService.getUser('userName'),
      upload_user_id: this.userService.getUser('userId'),
      create_date: moment(new Date()).format('YYYY/MM/DD HH:mm:ss'),
      lastModified: moment(new Date(file.lastModified)).format('YYYY/MM/DD HH:mm:ss'),
      isImageUrl: true,
      isUploading: false,
      showDownload: true,
      showDelete: false,
      id: file.id,
      linkProps: file.linkProps,
      message: file.message,
      name: file.name,
      row_data: file.row_data,
      size: file.size,
      status: 'done',
      uid: file.uid,
      url: file.url,
    };
  }
}
