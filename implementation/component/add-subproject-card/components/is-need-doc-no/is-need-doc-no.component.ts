import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AddSubProjectCardService } from '../../add-subproject-card.service';

@Component({
  selector: 'app-is-need-doc-no',
  templateUrl: './is-need-doc-no.component.html',
  styleUrls: ['./is-need-doc-no.component.less']
})
export class IsNeedDocNoComponent implements OnInit, OnChanges {
  /** 任务模版信息 */
  @Input() taskTemplateInfo = { task_category: '' };
  @Input() validateForm: FormGroup = this.fb.group({
    is_need_doc_no: [false]
  });

  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    protected changeRef: ChangeDetectorRef,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
  }

  get taskCategory(): string {
    return this.taskTemplateInfo?.task_category;
  }

  get conditionTypeList(): string[] {
    return ['PRSUM', 'POSUM', 'MOOP', 'SFT', 'APC', 'APC_O'];
  }

  get isDisable(): boolean {
    return this.addSubProjectCardService.isPreview || this.addSubProjectCardService.currentCardInfo?.someEdit;
  }

  /**
   * 勾选或取消是否需要单别单号
   */
  needDocNoChange() {
    this.setSequenceNumber();
    this.setDocTypeNoAndDocNo();
  }

  /**
   * 是否需要单别变化
   */
  setSequenceNumber() {
    this.addSubProjectCardService.validateForm.get('seq').disable();
    if (['MOOP'].includes(this.taskCategory) && !this.addSubProjectCardService.isPreview) {
      if (this.addSubProjectCardService.validateForm.getRawValue().is_need_doc_no) {
        this.addSubProjectCardService.validateForm.get('seq').enable();
      } else {
        this.addSubProjectCardService.validateForm.get('seq').patchValue('');
      }
    }
  }

  /**
   * 设置单别单号
   */
  setDocTypeNoAndDocNo(): void {
    if (['PRSUM', 'POSUM', 'MOOP'].includes(this.taskCategory)) {
      const { is_need_doc_no } = this.addSubProjectCardService.validateForm.getRawValue();
      if (is_need_doc_no) {
        ['doc_type_no', 'doc_no'].forEach((key: string) => {
          if(!this.addSubProjectCardService.isPreview){
            this.addSubProjectCardService.validateForm.get(key).enable();
          }else{
            this.addSubProjectCardService.validateForm.get(key).disable();
          }
        });
      } else {
        ['doc_type_no', 'doc_no'].forEach((key: string) => {
          this.addSubProjectCardService.validateForm.get(key).patchValue('');
          this.addSubProjectCardService.validateForm.get(key).disable();
        });
      }
    }
  }
}
