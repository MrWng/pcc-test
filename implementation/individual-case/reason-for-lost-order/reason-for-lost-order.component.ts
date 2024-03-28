import { Component, OnInit, Input, ChangeDetectorRef, ElementRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  DwFormGroup,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormService,
  DynamicFormValidationService,
  DynamicTableModel,
  isEmpty,
} from '@athena/dynamic-core';
import { CommonService } from '../../service/common.service';
import { OpenWindowService } from '@athena/dynamic-ui';
import { TranslateService } from '@ngx-translate/core';
import { APIService } from '../../service/api.service';
import { Subscription } from 'rxjs';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { ReasonForLostOrderService } from './reason-for-lost-order.service';
@Component({
  selector: 'app-dynamic-reason-for-lost-order',
  templateUrl: './reason-for-lost-order.component.html',
  styleUrls: ['./reason-for-lost-order.component.less'],
  providers: [ReasonForLostOrderService],
})
export class ReasonForLostOrderComponent implements OnInit {
  subs: Subscription[] = [];
  public curFormGroup: DwFormGroup;
  public curFormLayout: DynamicFormLayout;
  public curFormModel: DynamicTableModel[];
  list = [
    {
      value: 'A',
      label: this.translateService.instant('dj-pcc-价格原因'),
    },
    {
      value: 'B',
      label: this.translateService.instant('dj-pcc-技术原因'),
    },
    {
      value: 'C',
      label: this.translateService.instant('dj-pcc-商务原因'),
    },
    {
      value: 'D',
      label: this.translateService.instant('dj-pcc-策略性放弃'),
    },
  ];
  get reason_for_lost_order() {
    return this.data._component.reason_for_lost_order;
  }
  set reason_for_lost_order(value) {
    this.data._component.reason_for_lost_order = value;
  }
  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public wbsService: CommonService,
    public openWindowService: OpenWindowService,
    private translateService: TranslateService,
    public fb: FormBuilder,
    public apiService: APIService,
    private reasonForLostOrderService: ReasonForLostOrderService,
    private formService: DynamicFormService,
    private modal: AthModalService,
    private athMessageService: AthMessageService
  ) {}
  @Input() data: any;
  ngOnInit() {}
  ngOnDestory() {}
}
