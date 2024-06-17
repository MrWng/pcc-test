import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChildren,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
// eslint-disable-next-line max-len
import {
  DwFormArray,
  DwFormControl,
  DwFormGroup,
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@athena/dynamic-core';
import { DynamicPccProblemHandlingModel } from '../../../model/pcc-problem-handling/pcc-problem-handling.model';
import { PccProblemHandlingService } from './pcc-problem-handling.service';
import { CommonService } from '../../../service/common.service';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { MaintenanceInformationComponent } from './components/maintenance-information/maintenance-information.component';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { DynamicTaskTableComponent } from '@athena/dynamic-ui';
import { Subscription } from 'rxjs';
import { QuestDoStatus, QuestPageType } from './config';
import { AcModalService } from '@app-custom/ui/modal';

@Component({
  selector: 'app-pcc-problem-handling',
  templateUrl: './pcc-problem-handling.component.html',
  styleUrls: ['./pcc-problem-handling.component.less'],
  providers: [PccProblemHandlingService, CommonService, AcModalService],
})
export class PccProblemHandlingComponent
  extends DynamicFormControlComponent
  implements OnInit, OnDestroy
{
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicPccProblemHandlingModel;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();
  QuestDoStatus = QuestDoStatus;
  QuestPageType = QuestPageType;
  pageHeight: number = 0;
  sub: Subscription = new Subscription();
  get processStatus() {
    return this.group.get('process_status').value;
  }
  // 转任务 - 控制操作栏位是否可进行操作
  get isConversionTask() {
    // return this.processStatus === QuestDoStatus.TRANSFERRED_TASKS;
    return this.group.get('is_conversion_task').value;
  }
  // 问题处理卡并且处理状态是未完成才允许转任务
  get showTransTaskBtn() {
    return (
      (this.model.content['pageType'] === QuestPageType.PROBLEM_HANDLING ||
        this.model.content['pageType'] === QuestPageType.THE_ISSUE_IS_BOUNCED) &&
      this.processStatus === QuestDoStatus.INCOMPLETION &&
      !this.isConversionTask
    );
  }
  transTaskLoading: boolean = false;
  delLoading: boolean = false;
  editLoading: boolean = false;
  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private pccProblemHandlingService: PccProblemHandlingService,
    public commonService: CommonService,
    public athMessageService: AthMessageService,
    public modalService: AthModalService,
    public acModalService: AcModalService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit() {
    this.initPageHandler();
  }
  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
  startMaintenanceInformation({
    formGroup,
    onOk,
    nzOnCancel,
  }: {
    formGroup?: DwFormGroup | FormGroup;
    onOk?: (e: any) => any;
    nzOnCancel?: (e: any) => any;
  }) {
    const model = this.modalService.create({
      nzTitle: this.commonService.translatePccWord('问题处理事项'),
      nzKeyboard: false,
      nzMaskClosable: false,
      nzWrapClassName: 'ath-grid-modal-wrap',
      nzContent: MaintenanceInformationComponent,
      nzOkDisabled: true,
      nzComponentParams: {
        getModel: () => {
          return model;
        },
        sourceFormGroup: formGroup,
        dynamicModel: this.model,
        pageData: this.pccProblemHandlingService.pageData,
      },
      gridConfig: {
        span: 6,
        modalType: 'form-modal',
      },
      nzOnCancel: (e: MaintenanceInformationComponent) => {
        if (
          e.openWindowEmployee &&
          e.openWindowEmployee.openWindow2Params &&
          e.openWindowEmployee.openWindow2Params['formGroupValue']
        ) {
          e.openWindowEmployee.openWindow2Params.formGroupValue = [];
        }
      },
      nzOnOk: async (e: MaintenanceInformationComponent) => {
        const fileList = await e.removeFiles();
        const formValue = e.maintenanceInfoForm.getRawValue();
        formValue['plan_finish_datetime'] = this.pccProblemHandlingService.formatDateTransform(
          formValue['plan_finish_datetime']
        );
        formValue['actual_finish_datetime'] = this.pccProblemHandlingService.formatDateTransform(
          formValue['actual_finish_datetime']
        );
        formValue.attachment.data = fileList;
        // eslint-disable-next-line no-unused-expressions
        onOk && onOk(formValue);
      },
    });
    return model;
  }
  /**
   * 转任务
   */
  async transTaskHandler(): Promise<any> {
    try {
      this.transTaskLoading = true;
      const e = this.group.getRawValue() || {};
      const errInfo = await this.pccProblemHandlingService.employeeNameVerifyFn([e]);
      if (errInfo) {
        return this.acModalService.error({
          nzContent: errInfo.errorMsg,
          nzOkText: this.commonService.translatePccWord('知道了'),
        });
      }
      // 更新状态
      await this.pccProblemHandlingService.updateQuestionDo([
        {
          ...e,
          actual_finish_datetime: this.isEmpty(e.actual_finish_datetime)
            ? '9998-12-31 00:00:0000'
            : e.actual_finish_datetime,
          update_type: '1',
          is_conversion_task: true,
          // process_status: QuestDoStatus.TRANSFERRED_TASKS,
        },
      ]);
      // 发任务卡
      await this.commonService
        .publishTaskCark(
          [
            {
              question_no: this.group.get('question_no').value,
              question_do_no: this.group.get('question_do_no').value,
            },
          ],
          'PCC_mainline_project_0001'
        )
        .toPromise();
      // this.group.get('process_status').setValue(QuestDoStatus.TRANSFERRED_TASKS);
      this.group.get('is_conversion_task').setValue(true);
      this.athMessageService.success(this.commonService.translatePccWord('转任务成功'));
    } catch (error) {
    } finally {
      this.transTaskLoading = false;
    }
  }
  editTableCell() {
    this.pccProblemHandlingService.startMaintenanceInformation({
      formGroup: this.group,
      onOk: async (e) => {
        try {
          this.editLoading = true;
          await this.pccProblemHandlingService.updateQuestionDo([
            {
              ...e,
              actual_finish_datetime: this.isEmpty(e.actual_finish_datetime)
                ? '9998-12-31 00:00:0000'
                : e.actual_finish_datetime,
              update_type: '1',
            },
          ]);
          // 修改table行数据
          this.group.patchValue({
            ...e,
            plan_finish_datetime: this.pccProblemHandlingService.formatDateTransform(
              e.plan_finish_datetime,
              'yyyy/MM/dd'
            ),
            actual_finish_datetime: this.pccProblemHandlingService.formatDateTransform(
              e.actual_finish_datetime,
              'yyyy/MM/dd'
            ),
          });
          this.commonService.pushFormArray(
            this.group.get('attachment').get('data') as DwFormArray,
            e.attachment.data
          );
          this.athMessageService.success(this.commonService.translatePccWord('数据保存成功'));
        } finally {
          this.editLoading = false;
        }
      },
    });
  }
  async delTableCell(): Promise<any> {
    try {
      this.delLoading = true;
      const { question_do_no } = this.group.getRawValue();
      const question_no =
        this.group.parent?.['pageData']?.question_no ||
        this.pccProblemHandlingService?.['pageData']?.question_no;
      await this.pccProblemHandlingService.deleteQuestionDo([
        {
          question_no,
          question_do_no,
        },
      ]);
      const dynamicTable = this.group.parent['_component'] as DynamicTaskTableComponent;
      dynamicTable.removeRow(this.group['uuid']);
      this.athMessageService.success(this.commonService.translatePccWord('删除成功'));
    } finally {
      this.delLoading = false;
    }
  }
  private fileFormate(fileList: DwFormGroup[]) {
    fileList.forEach((file) => {
      file.addControl(
        'url',
        new DwFormControl(
          this.pccProblemHandlingService.filePreviewPrefixUrl + file.get('id').value
        )
      );
      file.addControl('uid', new DwFormControl(file.get('id').value));
      file.addControl('status', new DwFormControl('done'));
      file.addControl(
        'lastModified',
        new DwFormControl(new Date(file.get('create_date').value).getTime())
      );
    });
  }
  private initPageHandler() {
    let curPageCop = this.componentCollection || ([] as any);
    curPageCop = curPageCop[curPageCop.length - 1];
    const setPageHeight = () => {
      curPageCop.component.elementRef.nativeElement.parentNode.style.height = '100%';
    };
    const setPageReadOnly = (isReadonly?: boolean) => {
      if (this.isNotEmpty(isReadonly)) {
        this.model.content['pageReadonly'] = isReadonly;
      }
      if (this.isNotEmpty(this.model.finished) && this.model.finished) {
        this.model.content['pageReadonly'] = true;
      }
    };
    // 追加数据用于get接口查询
    switch (this.model.type) {
      // 基础资料
      case 'DataEntry_pccProjectQuestionList-browse-page':
        this.model.content.pageData = (
          this.group?.get('parameterData')?.get('question_list_info') as any
        )?.getRawValue();
        this.model.content['pageType'] = QuestPageType.BASIC_INFORMATION;
        setPageReadOnly(true);
        setPageHeight();
        break;
      // 问题处理
      case 'PCC_task_0012-task-detail-waitting':
        this.model.content.pageData =
          this.model.content.bpmData?.question_info ||
          (this.group?.get('question_list_info') as any)?.getRawValue() ||
          [];
        this.model.content['pageType'] = QuestPageType.PROBLEM_HANDLING;
        setPageReadOnly();
        setPageHeight();
        break;
      // 问题验收
      case 'PCC_task_0013-task-detail-uibot__data__state__00000':
        this.model.content.pageData =
          this.model.content.bpmData?.question_info ||
          (this.group?.get('question_list_info') as any)?.getRawValue() ||
          [];
        this.model.content['pageType'] = QuestPageType.PROBLEM_ACCEPTANCE;
        this.model.content.pageCanSubmit = !this.model.content.finished;
        setPageReadOnly(true);
        setPageHeight();
        break;
      // 问题退回
      case 'PCC_task_0014-task-detail-waitting':
        this.model.content.pageData =
          this.model.content.bpmData.question_info ||
          (this.group?.get('question_list_info') as any)?.getRawValue() ||
          [];
        this.model.content['pageType'] = QuestPageType.THE_ISSUE_IS_BOUNCED;
        setPageReadOnly();
        setPageHeight();
        break;
      // 项目问题看板
      case 'question_row_detail_info':
        this.model.content.pageData =
          this.model.content.bpmData.question_info ||
          (this.group?.get('question_list_info') as any)?.getRawValue() ||
          [];
        this.model.content['pageType'] = QuestPageType.BASIC_INFORMATION;
        setPageReadOnly(true);
        break;
      default:
        break;
    }
    this.pccProblemHandlingService.startMaintenanceInformation =
      this.startMaintenanceInformation.bind(this);
    this.commonService.content = this.pccProblemHandlingService.content = this.model.content;
    if (this.model.useType === 'attachment') {
      this.fileFormate((this.control.get('data') as any).controls);
    }
  }
}