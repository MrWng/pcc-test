import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, } from '@angular/core';
import { FormGroup } from '@angular/forms';
// eslint-disable-next-line max-len
import { DynamicFormControlComponent, DynamicFormControlLayout, DynamicFormLayout, DynamicFormLayoutService, DynamicFormValidationService, } from '@ng-dynamic-forms/core';
import { DynamicProjectDeliverableModel } from '../../../model/project-deliverable/project-deliverable.model';
import { ProjectDeliverableService } from './project-deliverable.service';
import { CommonService } from '../../../service/common.service';
import { UploadFile } from 'ngx-ui-athena/src/components/upload';
import { UploadAndDownloadService } from 'app/customization/task-project-center-console/service/upload.service';
import { NzMessageService } from 'ng-zorro-antd/message';

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
  @Input() deliverable_info: any = []

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private projectDeliverableService: ProjectDeliverableService,
    public commonService: CommonService,
    public uploadService: UploadAndDownloadService,
    private messageService: NzMessageService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit() {
    this.commonService.content = this?.model?.content;
    if (this.group?.value?.deliverable_info) {
      this.deliverable_info = this.group?.value?.deliverable_info;
    }
  }

  downLoad(file: any): void {
    const params = {
      doc_info: [{
        deliverable_no: file.delivery_no
      }]
    };
    this.projectDeliverableService.project_task_delivery_enclosure_data_get(params).then((doc_info) => {
      if (doc_info?.code === '0' && doc_info?.deliverable_attachment_link) {
        fetch(doc_info?.deliverable_attachment_link)
          .then(res => res.blob()).then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = file.delivery_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          });
      } else {
        const err = doc_info?.code === '4' ? '交付物正在上传' : doc_info?.code === '3' ? '交付物已删除' : '交付物不存在';
        this.messageService.error(err);
      }
    });
  }

  previewFile(file: any): void {
    const params = {
      doc_info: [{
        deliverable_no: file.delivery_no
      }]
    };

    this.projectDeliverableService.project_task_delivery_enclosure_data_get(params).then((doc_info) => {
      if (doc_info?.code === '0' && doc_info?.deliverable_attachment_link) {
        window.open(doc_info?.deliverable_attachment_link);
      } else {
        const err = doc_info?.code === '4' ? '交付物正在上传' : doc_info?.code === '3' ? '交付物已删除' : '交付物不存在';
        this.messageService.error(err);
      }
    });
  }
}
