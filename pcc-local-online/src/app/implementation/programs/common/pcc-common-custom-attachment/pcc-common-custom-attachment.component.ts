import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
// eslint-disable-next-line max-len
import {
  DwFormArray,
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@athena/dynamic-core';
import { DynamicPccCommonCustomAttachmentModel } from 'app/implementation/model/pcc-common-custom-attachment/pcc-common-custom-attachment.model';
import { PccCommonCustomAttachmentService } from './pcc-common-custom-attachment.service';
import { CommonService } from 'app/implementation/service/common.service';
import { UUID } from 'angular2-uuid';
import { SubmitButtonsService } from '@athena/dynamic-ui';
// baseDataEntryProjectMemorabilia_code
@Component({
  selector: 'app-pcc-common-custom-attachment',
  templateUrl: './pcc-common-custom-attachment.component.html',
  styleUrls: ['./pcc-common-custom-attachment.component.less'],
  providers: [PccCommonCustomAttachmentService, CommonService],
})
export class PccCommonCustomAttachmentComponent
  extends DynamicFormControlComponent
  implements OnInit, AfterViewInit
{
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicPccCommonCustomAttachmentModel;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();
  get fileList() {
    return this._fileList;
  }
  set fileList(value) {
    this._fileList = this.commonService.fileFormate(value, this.sourceAbort?.getFileAttr?.() || {});
    if (this.pending) {
      return;
    }
    this.commonService.pushFormArray(this.control.get('data') as DwFormArray, value);
    this.group.get('uibot_checked')?.setValue(true);
  }
  private _fileList = [];
  private pending: boolean = true;
  fileCount = 3;
  useBy = 'table';
  fileSize;
  sourceTypeMap = {
    baseDataEntryProjectMemorabilia: {
      init: this.baseDataEntryProjectMemorabiliaInitHandler.bind(this),
      getFileAttr() {
        return {
          category: 'baseDataEntryProjectMemorabilia_code',
          category_id: UUID.UUID(),
        };
      },
    },
    manual_DTD_Assignment: {
      init: this.manualDTDAssignmentInitHandler.bind(this),
      // getFileAttr() {
      //   return {
      //     category: 'baseDataEntryProjectMemorabilia_code',
      //     category_id: UUID.UUID(),
      //   };
      // },
    },
  };
  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private pccCommonCustomAttachmentService: PccCommonCustomAttachmentService,
    public commonService: CommonService,
    public submitButtonsService: SubmitButtonsService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }
  get _component() {
    return (this.group.parent as any)._component as any;
  }
  get sourceAbort() {
    return this.sourceTypeMap[this.model.content.executeContext.tmActivityId];
  }
  removeHandler = this.removeFile.bind(this);
  ngOnInit() {
    this.commonService.content = this.model.content;
    this.sourceAbort.init();
  }
  ngAfterViewInit() {
    this._component.columnApi?.autoSizeColumn('project_attachment');
  }
  removeFile(file) {
    this.pending = false;
    this.fileList = this.fileList.filter((item) => item.id !== file.id);
    return false;
  }
  fileChange(e) {
    switch (e.type) {
      case 'success':
        this.pending = false;
        this.fileList = e.fileList;
        break;
      case 'remove':
        this.pending = false;
        this.fileList = e.fileList;
        break;
      default:
        break;
    }
  }
  // 项目大事记
  baseDataEntryProjectMemorabiliaInitHandler() {
    this.pending = true;
    this.fileSize = 52428800;
    this.fileCount = 3;
    this.fileList = (this.control.get('data') as DwFormArray).getRawValue();
  }
  // 手动任务
  manualDTDAssignmentInitHandler() {
    this.pending = true;
    this.fileSize = 52428800;
    this.fileCount = 3;
    this.fileList = (this.control.get('data') as DwFormArray).getRawValue();
  }
}
