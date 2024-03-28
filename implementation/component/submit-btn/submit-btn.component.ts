import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  SkipSelf,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  DwFormControl,
  DwFormGroup,
  DynamicFormLayout,
  DynamicFormService,
  DynamicTableModel,
  isEmpty,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { BaseDynamicCompBuilder } from 'app/implementation/class/DynamicCom';
import { CommonService } from 'app/implementation/service/common.service';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { SubmitBtnService } from './submit-btn.service';
import { AthModalService } from '@athena/design-ui';
import { ValidationErrors, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Observable, Observer } from 'rxjs';

@Component({
  selector: 'app-submit-btn',
  templateUrl: './submit-btn.component.html',
  styleUrls: ['./submit-btn.component.less'],
  providers: [SubmitBtnService, AthModalService],
})

/**
 * 项目计划维护
 */
export class PccSubmitBtnComponent implements OnInit, OnChanges, OnDestroy {
  @Input() btnText: string;
  @Input() btnType: string = 'default';
  @Input() btnDisabled: boolean = false;
  @Input() btnNoSubmit: boolean = false;
  @Input() modalTitle: string;
  @Input() employeePlaceHolder: string;
  @Input() needEmployee: boolean = true;
  @Input() descPlaceHolder: string;
  @Input() descRequired: boolean = true;
  @Input() employeeRequired: boolean = true;
  @Input() okFn;
  @Input() verifyFn;
  @Input() btnSubmitBefore;
  @Input() employeeValidators = [];
  @Input() employeeAsyncValidators = [];
  @Input() defaultData: any = {};
  @ViewChild('openWindowContent') openWindowContent: TemplateRef<any>;
  formGroup: DwFormGroup;
  model: NzModalRef;
  openWindowEmployee = this.commonService.generationOpenWindowEmployee({
    callBacK: this.selectPeople.bind(this),
  });
  get employeeValidateStatus() {
    const employeeNameCtr = this.formGroup.get('employeeName');
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
    public modalService: AthModalService
  ) {}
  ngOnInit() {
    this.createGroup();
  }
  ngOnChanges(e: SimpleChanges) {}
  ngOnDestroy() {}
  createGroup() {
    const desValidators = [],
      employeeValidators = [],
      employeeAsyncValidators = (this.employeeAsyncValidators || []).map((validator) => {
        return (e: DwFormControl) => {
          if (!e.dirty) {
            return Promise.resolve(null);
          }
          if (isEmpty(e.value) || isEmpty(e.parent)) {
            return Promise.resolve(null);
          }
          return validator(e);
        };
      });
    if (this.descRequired) {
      desValidators.push(Validators.required);
    }
    if (this.employeeRequired && this.needEmployee) {
      employeeValidators.push(Validators.required);
    }

    this.formGroup = new DwFormGroup({
      employeeName: new DwFormControl('', employeeValidators, employeeAsyncValidators),
      employeeInfo: new DwFormGroup(
        this.commonService.transformFromGroup({
          employee_no: '',
          employee_name: '',
        })
      ),
      description: new DwFormControl('', desValidators),
    });
    this.setDefaultValue();
    this.formGroup.statusChanges.pipe(debounceTime(100)).subscribe((e) => {
      if (this.model) {
        this.triggerModelOkDisabled();
      }
    });
  }
  openWindow() {
    if (
      this.btnSubmitBefore &&
      typeof this.btnSubmitBefore === 'function' &&
      (this.btnNoSubmit || this.btnDisabled)
    ) {
      this.btnSubmitBefore();
    }
    if (this.btnNoSubmit || this.btnDisabled) {
      return;
    }

    this.formGroup.reset();
    this.setDefaultValue();
    this.model = this.modalService.create({
      nzTitle: this.modalTitle,
      nzWrapClassName: 'ath-grid-modal-wrap',
      nzContent: this.openWindowContent,
      nzComponentParams: {},
      nzMaskClosable: false,
      nzOkDisabled: true,
      gridConfig: {
        span: 6,
        modalType: 'form-modal',
      },
      nzOnCancel: (): void => {
        this.openWindowEmployee.openWindow2Params['formGroupValue'] = [];
      },
      nzOnOk: () => {
        if (this.okFn) {
          const backParams = {
            employeeInfo:
              this.formGroup.get('employeeInfo')?.value || this.defaultData?.employeeInfo || {},
            description: this.formGroup.get('description').value,
          };
          return this.okFn(backParams);
        }
      },
    });
    this.model.afterOpen.subscribe(() => {
      this.triggerModelOkDisabled();
    });
    return this.model;
  }
  triggerModelOkDisabled() {
    const model = this.model;
    model.updateConfig(
      Object.assign(model.getConfig(), {
        nzOkDisabled: this.formGroup.status === 'PENDING' ? true : this.formGroup.invalid,
      })
    );
  }
  private setDefaultValue() {
    const { employeeInfo = {}, description = '' } = this.defaultData || ({} as any);
    this.formGroup.get('employeeName').setValue(employeeInfo.employee_name);
    this.formGroup.get('employeeInfo').patchValue(employeeInfo);
    this.formGroup.get('description').setValue(description);
    this.openWindowEmployee.openWindow2Params['formGroupValue'] = [
      this.formGroup.get('employeeInfo').value,
    ];
  }

  private async selectPeople(res: any) {
    const backParams = {
      employeeInfo: res[0],
      description: this.formGroup.get('description').value,
    };
    const employeeNameCtr = this.formGroup.get('employeeName');
    if (this.verifyFn) {
      const verifyRes = await this.verifyFn(backParams);
      if (!verifyRes) {
        employeeNameCtr.markAsDirty();
        employeeNameCtr.setValue('');
        this.formGroup.removeControl('employeeInfo');
        return;
      }
    }
    if (!this.formGroup.get('employeeInfo')) {
      this.formGroup.addControl(
        'employeeInfo',
        new DwFormGroup(this.commonService.transformFromGroup(res[0]))
      );
    } else {
      this.formGroup.get('employeeInfo').patchValue(res[0]);
    }
    employeeNameCtr.markAsDirty();
    employeeNameCtr.setValue(res[0].employee_name);
    this.openWindowEmployee.openWindow2Params['formGroupValue'] = [
      this.formGroup.get('employeeInfo').value,
    ];
  }
  errorHandel(key: string) {
    const errors = this.formGroup.get(key).errors || {};
    if (errors.required) {
      return this.commonService.translateDefaultWord('必填');
    }
    if (errors.error) {
      return errors.errorMsg;
    }
  }
}
