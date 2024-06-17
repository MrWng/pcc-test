import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
// eslint-disable-next-line max-len
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  cloneDeep,
} from '@athena/dynamic-core';
import { DynamicProjectDeliverableModel } from '../../../model/project-deliverable/project-deliverable.model';
import { ProjectDeliverableService } from './project-deliverable.service';
import { CommonService } from '../../../service/common.service';
import { UploadFile } from '@athena/design-ui/src/components/upload';
import { UploadAndDownloadService } from 'app/implementation/service/upload.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { DwDmcRepository } from '@webdpt/framework/dmc';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-project-deliverable',
  templateUrl: './project-deliverable.component.html',
  styleUrls: ['./project-deliverable.component.less'],
  providers: [ProjectDeliverableService, CommonService],
})
export class ProjectDeliverableComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicProjectDeliverableModel;
  @Input() deliverable_info: any = [];

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();
  public dmcUrl: string;
  deliverable_plm: any = {};
  deliverable_plm_attachment: any = {};

  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    private dwDmcRepository: DwDmcRepository,
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private projectDeliverableService: ProjectDeliverableService,
    public commonService: CommonService,
    public uploadService: UploadAndDownloadService,
    private messageService: NzMessageService,
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private translateService: TranslateService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
    this.configService.get('dmcUrl').subscribe((url) => {
      this.dmcUrl = url + '/api/dmc/v2/';
    });
  }

  ngOnInit() {
    this.commonService.content = this?.model?.content;
    if (this.group?.value?.deliverable_info) {
      this.deliverable_info = this.group?.value?.deliverable_info;
    } else if (
      this.group?.value?.category &&
      this.group?.value?.category === 'manualAssignmentDelivery_PLM'
    ) {
      this.deliverable_plm = cloneDeep(this.group?.value);
      if (Object.keys(this.deliverable_plm).length) {
        this.deliverable_plm_attachment =
          this.deliverable_plm['attachment'] ?? this.deliverable_plm['attachment1'];
        if (this.deliverable_plm_attachment?.data?.length) {
          const deliverable_info = [];
          this.deliverable_plm_attachment?.data?.forEach((info) => {
            const file = {
              delivery_no: info.id,
              delivery_name: info.name,
            };
            deliverable_info.push(file);
          });
          this.deliverable_info = deliverable_info;
        }
      }
    }
  }

  downLoad(file: any): void {
    const params = {
      doc_info: [
        {
          type: '1', // 下载
          deliverable_no: file.delivery_no,
        },
      ],
    };
    this.projectDeliverableService
      .project_task_delivery_enclosure_data_get(params)
      .then((doc_info) => {
        if (
          doc_info?.code === '0' &&
          doc_info?.deliverable_no &&
          doc_info?.token &&
          doc_info?.deliverable_attachment_link
        ) {
          this.downloadMultiUrl(doc_info, file.delivery_name).subscribe((res) => {});
          // fetch(doc_info?.deliverable_attachment_link)
          //   .then(res => res.blob()).then(blob => {
          //     const a = document.createElement('a');
          //     a.href = URL.createObjectURL(blob);
          //     a.download = file.delivery_name;
          //     document.body.appendChild(a);
          //     a.click();
          //     document.body.removeChild(a);
          //   });
        } else {
          const err =
            doc_info?.code === '4'
              ? '交付物正在上传'
              : doc_info?.code === '3'
              ? '交付物已删除'
              : '交付物不存在';
          this.messageService.error(err);
        }
      });
  }

  // 文档中心，下载方式
  public downloadMulti(params) {
    return this.http.get(params.deliverable_attachment_link, {
      responseType: 'blob',
      headers: {
        'digi-middleware-auth-user': params?.token ?? this.authToken?.token,
      },
    });
  }

  public downloadMultiUrl(params, fileName): Observable<any> {
    return new Observable((observer) => {
      // this.dwDmcRepository.login().subscribe((r1) => {
      this.downloadMulti(params).subscribe((res) => {
        const aLink = window.document.createElement('a');
        const blob = new Blob([res], { type: 'application/octet-stream' });
        const objUrl = window.URL.createObjectURL(blob);
        aLink.href = objUrl;
        aLink.download = fileName;
        aLink.style.visibility = 'hidden';
        document.body.appendChild(aLink);
        const evt = document.createEvent('MouseEvents');
        evt.initEvent('click', false, false);
        aLink.dispatchEvent(evt);
        window.URL.revokeObjectURL(objUrl);
        document.body.removeChild(aLink);
        observer.next(res);
        observer.complete();
      });
      // });
    });
  }

  previewFile(file: any): void {
    const params = {
      doc_info: [
        {
          type: '0', // 预览
          deliverable_no: file.delivery_no,
        },
      ],
    };

    this.projectDeliverableService
      .project_task_delivery_enclosure_data_get(params)
      .then((doc_info) => {
        if (doc_info?.code === '0' && doc_info?.deliverable_attachment_link) {
          window.open(doc_info?.deliverable_attachment_link);
        } else {
          const err =
            doc_info?.code === '4'
              ? '交付物正在上传'
              : doc_info?.code === '3'
              ? '交付物已删除'
              : '交付物不存在';
          this.messageService.error(err);
        }
      });
  }
}
