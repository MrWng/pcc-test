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
import { DynamicPccRiskMaintenanceTableAddModel } from '../../../model/pcc-risk-maintenance-table-add/pcc-risk-maintenance-table-add.model';
import { PccRiskMaintenanceTableAddService } from './pcc-risk-maintenance-table-add.service';
import { CommonService } from '../../../service/common.service';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { PccRiskDetailMaintenanceComponent } from 'app/implementation/component/wbs-tabs/components/risk-maintenance/component/maintenance.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-pcc-risk-maintenance-table-add',
  templateUrl: './pcc-risk-maintenance-table-add.component.html',
  styleUrls: ['./pcc-risk-maintenance-table-add.component.less'],
  providers: [PccRiskMaintenanceTableAddService, CommonService],
})
export class PccRiskMaintenanceTableAddComponent
  extends DynamicFormControlComponent
  implements OnInit
{
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicPccRiskMaintenanceTableAddModel;
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
    private pccRiskMaintenanceTableAddService: PccRiskMaintenanceTableAddService,
    public commonService: CommonService,
    private athModalService: AthModalService,
    private translateService: TranslateService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit() {
    this.commonService.content = this.model.content;
  }

  add() {
    this.change.emit({
      type: 'addRisk',
    });
  }
}
