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
import { DynamicCUSTPCCPROJECTCHANGEModel } from 'app/implementation/model/CUST_PCC_PROJECT_CHANGE/CUST_PCC_PROJECT_CHANGE.model';
import { CUSTPCCPROJECTCHANGEService } from './CUST_PCC_PROJECT_CHANGE.service';
import { CommonService } from 'app/implementation/service/common.service';

@Component({
  selector: 'app-CUST_PCC_PROJECT_CHANGE',
  templateUrl: './CUST_PCC_PROJECT_CHANGE.component.html',
  styleUrls: ['./CUST_PCC_PROJECT_CHANGE.component.less'],
  providers: [CUSTPCCPROJECTCHANGEService, CommonService],
})
export class CUSTPCCPROJECTCHANGEComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicCUSTPCCPROJECTCHANGEModel;
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
    private CUSTPCCPROJECTCHANGEService: CUSTPCCPROJECTCHANGEService,
    public commonService: CommonService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit() {
    this.commonService.content = this.model.content;
  }
}
