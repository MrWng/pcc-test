import {
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
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@athena/dynamic-core';
import { DynamicGaosiaoOtherInfoModel } from 'app/implementation/model/gaosiao-other-info/gaosiao-other-info.model';
import { GaosiaoOtherInfoService } from './gaosiao-other-info.service';
import { CommonService } from 'app/implementation/service/common.service';

@Component({
  selector: 'app-gaosiao-other-info',
  templateUrl: './gaosiao-other-info.component.html',
  styleUrls: ['./gaosiao-other-info.component.less'],
  providers: [GaosiaoOtherInfoService, CommonService],
})
export class GaosiaoOtherInfoComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicGaosiaoOtherInfoModel;
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
    private gaosiaoOtherInfoService: GaosiaoOtherInfoService,
    public commonService: CommonService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit() {
    this.commonService.content = this.model.content;
    this.group['_preSetValue'] = {
      ...(this.group.getRawValue() || {}),
    };
  }
}
