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
  isNotEmpty,
} from '@athena/dynamic-core';
// eslint-disable-next-line max-len
import { DynamicPccRiskMaintenanceTableOperateModel } from '../../../model/pcc-risk-maintenance-table-operate/pcc-risk-maintenance-table-operate.model';
import { PccRiskMaintenanceTableOperateService } from './pcc-risk-maintenance-table-operate.service';
import { CommonService } from '../../../service/common.service';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-pcc-risk-maintenance-table-operate',
  templateUrl: './pcc-risk-maintenance-table-operate.component.html',
  styleUrls: ['./pcc-risk-maintenance-table-operate.component.less'],
  providers: [PccRiskMaintenanceTableOperateService, CommonService],
})
export class PccRiskMaintenanceTableOperateComponent
  extends DynamicFormControlComponent
  implements OnInit
{
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicPccRiskMaintenanceTableOperateModel;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();

  dispatchLoading: boolean = false;
  maintenanceLoading: boolean = false;
  loseEfficacyLoading: boolean = false;
  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private pccRiskMaintenanceTableOperateService: PccRiskMaintenanceTableOperateService,
    public commonService: CommonService,
    private athModalService: AthModalService,
    private translateService: TranslateService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }
  get maintenanceDisabled() {
    const { risk_status, is_dispatch, risk_handle_status, isChanged } = this.group.getRawValue();
    if (!this.model.editable) {
      return true;
    }
    if (isNotEmpty(this.group['isNewRow'])) {
      return false;
    }
    if (isChanged === 0) {
      return !(
        (is_dispatch === false || (is_dispatch === true && risk_status === '1')) &&
        risk_status !== '3' &&
        risk_handle_status !== '3' &&
        risk_handle_status !== '4'
      );
    }

    return false;
  }
  get dispatchDisabled() {
    if (!this.model.editable) {
      return true;
    }
    const dirty = !!this.group['isDataChanged'];
    const { risk_status, is_dispatch } = this.group.getRawValue();
    return !(!dirty && risk_status !== '3' && is_dispatch === false);
  }
  get loseEfficacyDisabled() {
    if (!this.model.editable) {
      return true;
    }
    const dirty = !!this.group['isDataChanged'];
    const { risk_status } = this.group.getRawValue();
    return !(!dirty && risk_status === '2');
  }
  ngOnInit() {
    this.commonService.content = this.model.content;
  }
  onMaintenance() {
    this.change.emit({
      type: 'maintenance',
      group: this.group,
    });
  }
  onDispatch() {
    this.athModalService.confirm({
      nzTitle: null,
      nzContent: `<span class="tip-text">${this.translateService.instant(
        'dj-pcc-是否派送？'
      )}</span>`,
      nzClassName: 'confirm-modal-center-sty pcc-confirm-modal-center',
      nzOnOk: () => {
        this.change.emit({
          type: 'dispatch',
          group: this.group,
        });
      },
    });
  }
  onLoseEfficacy() {
    this.athModalService.confirm({
      nzTitle: null,
      nzContent: `<span class="tip-text">${this.translateService.instant(
        'dj-pcc-是否失效？'
      )}</span>`,
      nzClassName: 'confirm-modal-center-sty pcc-confirm-modal-center',
      nzOnOk: () => {
        this.change.emit({
          type: 'loseEfficacy',
          group: this.group,
        });
      },
    });
  }
}
