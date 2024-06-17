// eslint-disable-next-line max-len
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild, } from '@angular/core';
import { FormGroup } from '@angular/forms';
// eslint-disable-next-line max-len
import { DynamicFormControlComponent, DynamicFormControlLayout, DynamicFormLayout, DynamicFormLayoutService, DynamicFormValidationService } from '@athena/dynamic-core';
// eslint-disable-next-line max-len
import { CustomQuestionRowDetailInfoService } from './custom-question-row-detail-info-component.service';
import { CommonService } from '../../../service/common.service';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { HttpClient } from '@angular/common/http';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
// eslint-disable-next-line max-len
import { DynamicCustomQuestionRowDetailInfoComponentModel } from 'app/implementation/model/custom-question-row-detail-info-component/custom-question-row-detail-info-component.model';

@Component({
  selector: 'app-question-row-detail-component',
  templateUrl: './custom-question-row-detail-info-component.component.html',
  styleUrls: ['./custom-question-row-detail-info-component.component.less'],
  providers: [CustomQuestionRowDetailInfoService, CommonService],
})
export class CustomQuestionRowDetailInfoComponent extends DynamicFormControlComponent implements OnInit, OnDestroy {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicCustomQuestionRowDetailInfoComponentModel;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();
  @ViewChild('tplContent') tplContent: TemplateRef<any>;
  private refModal: NzModalRef;

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private customQuestionRowDetailInfoService: CustomQuestionRowDetailInfoService,
    public commonService: CommonService,
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private modalService: NzModalService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit() { }

  ngOnDestroy(): void {
    this.closeLoadingModal();
  }

  showDetailInfoWindow(): void {
    const content = {
      pageReadonly: true,
      pageType: '1',
      bpmData: {
        question_info: [this.group.value]
      },
    };
    Object.assign(this.model, { content });
    Object.assign(this.group, { value: { question_list_info: [this.group.value], ...this.group.value} });
    this.refModal = this.modalService.create({
      nzWrapClassName: 'pcc-template-modal-wrap',
      nzClassName: 'pcc-template-modal',
      nzTitle: '',
      nzContent: this.tplContent,
      nzFooter: null,
      nzCentered: true,
      nzMask: true,
      nzMaskClosable: false,
      nzClosable: false,
      nzKeyboard: false,
      nzOkDisabled: true,
      nzCancelDisabled: true
    });
  }

  // 关闭loading蒙层
  closeLoadingModal(): void {
    if (this.refModal) {
      this.refModal.close(); // 关闭
      this.refModal.destroy(); // 销毁对话框
    }
  }
}
