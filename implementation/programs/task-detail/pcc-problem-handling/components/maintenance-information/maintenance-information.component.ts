import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  SkipSelf,
  ViewChild,
} from '@angular/core';
import {
  DwFormArray,
  DwFormControl,
  DwFormGroup,
  DynamicFormLayout,
  DynamicFormService,
  DynamicTableModel,
  isNotEmpty,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { MaintenanceInformationService } from './maintenance-information.service';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { FormGroup, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { PccProblemHandlingService } from '../../pcc-problem-handling.service';
import { NzModalRef } from '@athena/dynamic-ui';
import { CommonService } from 'app/implementation/service/common.service';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { ProcessStatusMap, processStatus } from '../../config';
import { UUID } from 'angular2-uuid';
import { ModalFormService } from '@app-custom/ui/modal-form';
import { QuestionDoInfoModel } from '../problem-handling/components/handling-matters-table/Model';
import { ProblemHandlingService } from '../problem-handling/problem-handling.service';

@Component({
  selector: 'app-maintenance-information',
  templateUrl: './maintenance-information.component.html',
  styleUrls: ['./maintenance-information.component.less'],
  providers: [
    PccProblemHandlingService,
    ProblemHandlingService,
    MaintenanceInformationService,
    ModalFormService,
  ],
})
export class MaintenanceInformationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() getModel: () => NzModalRef;
  @Input() sourceFormGroup: DwFormGroup | FormGroup;
  @Input() dynamicModel;
  @Input() pageData;
  @ViewChild('upload') $upload;
  maintenanceInfoForm: DwFormGroup;
  fileList: any[] = [];
  delFileList: any[] = [];
  processStatus = processStatus;
  isProcessDescRequire: boolean = true;
  attachmentUploading: boolean = false;
  fileSize: number = 50 * 1024 * 1024;
  beforeUpload = this._beforeUpload.bind(this);
  fileRemoveHandler = this._fileRemoveHandler.bind(this);
  openWindowEmployee = this.commonService.generationOpenWindowEmployee({
    callBacK: this.selectPeople.bind(this),
  });
  get employeeValidateStatus() {
    const employeeNameCtr = this.maintenanceInfoForm.get('process_person_name');
    if (!employeeNameCtr.dirty) {
      return;
    }
    const status = employeeNameCtr?.status;
    if (status === 'PENDING') {
      return 'validating';
    }
    if (status === 'INVALID') {
      return 'error';
    }

    if (status === 'VALID') {
      return 'success';
    }
  }
  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    private athMessageService: AthMessageService,
    private formService: DynamicFormService,
    private pccProblemHandlingService: PccProblemHandlingService,
    private problemHandlingService: ProblemHandlingService,
    public maintenanceInformationService: MaintenanceInformationService,
    public acModalFormService: ModalFormService
  ) {}
  ngOnInit() {
    this.openWindowEmployee.executeContext = this.dynamicModel.content.executeContext;
    this.createGroup();
  }
  ngOnChanges(e) {}
  ngOnDestroy() {}
  createGroup() {
    const {
      question_do_desc,
      question_do_no,
      process_person_name,
      process_person_no,
      plan_finish_datetime,
      process_status = ProcessStatusMap.NO_DONE,
      actual_finish_datetime,
      process_description,
      attachment,
      seq,
      is_conversion_task,
      question_no,
    } = this.sourceFormGroup?.getRawValue() || new QuestionDoInfoModel();
    this.maintenanceInfoForm = new DwFormGroup({
      question_do_desc: new DwFormControl(question_do_desc, [Validators.required]),
      question_do_no: new DwFormControl(question_do_no),
      process_person_name: new DwFormControl(
        process_person_name,
        [Validators.required]
        // todo 人员权限校验
        // [this.employeeNameVerifyFn.bind(this)]
      ),
      process_person_no: new DwFormControl(process_person_no),
      plan_finish_datetime: new DwFormControl(
        this.pccProblemHandlingService.formatDateTransform(
          plan_finish_datetime || new Date().toDateString()
        ),
        [Validators.required]
      ),
      process_status: new DwFormControl(process_status || ProcessStatusMap.NO_DONE, [
        Validators.required,
      ]),
      actual_finish_datetime: new DwFormControl(
        this.pccProblemHandlingService.formatDateTransform(
          actual_finish_datetime || new Date().toDateString()
        ),
        [Validators.required]
      ),
      process_description: new DwFormControl(process_description),
      seq: new DwFormControl(seq),
      is_conversion_task: new DwFormControl(is_conversion_task),
      question_no: new DwFormControl(
        question_no ||
          this.pageData?.question_no ||
          this.sourceFormGroup?.parent?.['pageData']?.question_no ||
          ''
      ),
      attachment: new DwFormGroup(
        this.commonService.transformFromGroup(
          attachment || {
            row_data: UUID.UUID(),
            data: [],
          }
        )
      ),
    });
    this.openWindowEmployee.openWindow2Params['formGroupValue'] = [
      {
        employee_name: process_person_name,
        employee_no: process_person_no,
      },
    ];
    this.fileList = attachment?.data || [];
    this.maintenanceInfoForm.statusChanges.pipe(debounceTime(100)).subscribe((e) => {
      this.triggerModelOkDisabled();
    });
    this.setAFDataTimeAndPDescByProcessStatus(process_status);
  }
  /**
   * 弹窗确认按钮可编辑控制器
   */
  triggerModelOkDisabled() {
    const model = this.getModel();
    model.updateConfig(
      Object.assign(model.getConfig(), {
        nzOkDisabled:
          this.maintenanceInfoForm.status === 'PENDING'
            ? true
            : this.maintenanceInfoForm.invalid || this.attachmentUploading,
      })
    );
  }
  /**
   * 表单错误提示
   */
  errorHandel(key: string) {
    const errors = this.maintenanceInfoForm.get(key).errors || {};
    if (errors.required) {
      return this.commonService.translateDefaultWord('必填');
    }
    if (errors.error) {
      return errors.errorMsg;
    }
  }
  /**
   * 处理状态变化后
   */
  processStatusChange(_processStatus: string) {
    this.setAFDataTimeAndPDescByProcessStatus(_processStatus || '-1');
  }
  /**
   * 人员选择后事件
   */
  private selectPeople(res: any) {
    const processPersonNameCtr = this.maintenanceInfoForm.get('process_person_name');
    processPersonNameCtr.markAsDirty();
    processPersonNameCtr.setValue(res[0].employee_name);
    this.maintenanceInfoForm.get('process_person_no').setValue(res[0].employee_no);
    this.openWindowEmployee.openWindow2Params['formGroupValue'] = [res[0]];
  }
  /**
   * 根据处理状态设置计划日期是否可编辑
   * @param _processStatus 处理状态
   */
  private setAFDataTimeAndPDescByProcessStatus(_processStatus: string) {
    const afdControl = this.maintenanceInfoForm.get('actual_finish_datetime'),
      processDescControl = this.maintenanceInfoForm.get('process_description');
    switch (_processStatus) {
      case ProcessStatusMap.NO_DONE:
      case ProcessStatusMap.EMPTY:
        this.isProcessDescRequire = false;
        afdControl.setValue('');
        afdControl.disable();
        afdControl.removeValidators([Validators.required]);
        // processDescControl.setValue('');
        // processDescControl.disable();
        // processDescControl.removeValidators([Validators.required]);
        break;
      case ProcessStatusMap.DONE:
        this.isProcessDescRequire = true;
        afdControl.enable();
        afdControl.setValue(
          this.pccProblemHandlingService.formatDateTransform(
            afdControl.value || new Date().toDateString()
          )
        );
        afdControl.addValidators([Validators.required]);
        // processDescControl.enable();
        // processDescControl.addValidators([Validators.required]);
        break;
      default:
        break;
    }
  }
  /**
   * 附件上传处理
   */
  fileChange(e) {
    const file: any = e.file,
      type = e.type;
    const setAttachmentData = () => {
      this.commonService.pushFormArray(
        this.maintenanceInfoForm.get('attachment').get('data') as DwFormArray,
        this.fileList
      );
    };
    if (type === 'start') {
      this.changeFileUploading();
      return;
    }
    if (type === 'removed') {
      this.fileList = this.fileList.filter((item) => item.id !== file.id);
      setAttachmentData();
      return;
    }
    if (file && file.id) {
      this.fileList.forEach((item, index) => {
        if (item.id === file.id) {
          this.fileList[index] = this.maintenanceInformationService.deserializeAttachment(file);
        }
      });
      this.changeFileUploading();
      setAttachmentData();
    }
  }
  changeFileUploading() {
    this.attachmentUploading = this.fileList.some((file) => file.status === 'uploading');
    this.triggerModelOkDisabled();
  }
  /**
   * 删除附件事件，外部使用
   */
  removeFiles() {
    this.delFileList.forEach((file) => {
      this.$upload.delFile(file);
    });
  }
  /**
   * 选择人员异步校验
   */
  async employeeNameVerifyFn(e: DwFormControl): Promise<any> {
    const info = e.parent.getRawValue();
    let errorMsg = '';
    if (!info.process_person_name || !info.process_person_no || !e.dirty) {
      return Promise.resolve(null);
    }
    try {
      errorMsg = await this.problemHandlingService.checkEmployee([
        {
          employee_no: info.process_person_no,
          employee_name: info.process_person_name,
        },
      ]);
    } catch (error) {
    } finally {
      if (isNotEmpty(errorMsg)) {
        return Promise.resolve({
          error: true,
          errorMsg,
        });
      }
      return Promise.resolve(null);
    }
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
        this.commonService.translatePccWord('附件大小超过限制，当前支持50M')
      );
      return false;
    }
    return true;
  }
  /**
   * 附件移除事件
   */
  _fileRemoveHandler(file) {
    if (file.id) {
      this.delFileList.push(file);
    }
    this.fileList = this.fileList.filter((_file) => _file.uid !== file.uid);
    this.changeFileUploading();
    return false;
  }
}
