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
  ViewChild,
} from '@angular/core';
import {
  DwFormArray,
  DwFormGroup,
  DynamicFormLayout,
  DynamicFormService,
  DynamicTableModel,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'app/implementation/service/common.service';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { PccSelectPeopleService } from './select-people.service';
import { FormArray, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-select-people',
  templateUrl: './select-people.component.html',
  styleUrls: ['./select-people.component.less'],
  providers: [PccSelectPeopleService],
})

/**
 * 项目计划维护
 */
export class PccSelectPeopleComponent implements OnInit, OnChanges, OnDestroy {
  @Input() openWindowEmployee: any;
  @Input() label: string;
  @Input() innerLabel: boolean;
  @Input() required: boolean;
  @Input() placeholder: string;
  @Input() formControlKey: string;
  @Input() formGroup: FormGroup | DwFormGroup;
  @Input() linkSchema: string[];
  @Input() errorTip: string;
  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    private athMessageService: AthMessageService,
    private formService: DynamicFormService
  ) {}
  ngOnInit() {}
  ngOnChanges() {}
  ngOnDestroy() {}
  openWindowBeforeHandler(e) {
    const target = e.target;
    if (
      (target.nodeName === 'svg' && target.children[0]?.href?.baseVal === '#icon-kaichuang') ||
      (target.nodeName === 'use' && target.href.baseVal === '#icon-kaichuang')
    ) {
      return;
    }
    e.stopPropagation();
  }
  del() {
    const c = this.formGroup.get(this.formControlKey);
    if (
      this.openWindowEmployee &&
      this.openWindowEmployee.openWindow2Params &&
      this.openWindowEmployee.openWindow2Params.formGroupValue
    ) {
      this.openWindowEmployee.openWindow2Params.formGroupValue = [];
    }
    c.setValue('');
    c.markAsDirty();
    c.updateValueAndValidity();
    this.linkSchema.forEach((key) => {
      const _c = this.formGroup.get(key);
      if (_c instanceof DwFormGroup || _c instanceof FormGroup) {
        _c.reset();
      } else if (_c instanceof DwFormArray || _c instanceof FormArray) {
        _c.clear();
      } else {
        _c.setValue('');
      }
      _c.markAsDirty();
      _c.updateValueAndValidity();
    });
  }
}
