import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  SimpleChanges,
  OnChanges,
  OnDestroy,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '../../../../../service/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';

import {
  DwFormGroup,
  DynamicFormLayout,
  DynamicFormService,
  DynamicTableModel,
} from '@athena/dynamic-core';
import { PccRiskDetailMaintenanceService } from './maintenance.service';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { Subscription } from 'rxjs';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
import { DwUserService } from '@webdpt/framework/user';
import DataModel from '../data-model';

interface ModalOption {
  pageData?: any;
  modalTitle?: string;
}
@Component({
  selector: 'app-pcc-risk-detail-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.less'],
  providers: [PccRiskDetailMaintenanceService],
})
export class PccRiskDetailMaintenanceComponent implements OnInit, OnDestroy {
  @Input() model: any;
  @ViewChild('modalBody') modalBody: TemplateRef<any>;
  @ViewChild('modalFooter') modalFooter: TemplateRef<any>;
  @Output() confirm: EventEmitter<any> = new EventEmitter();
  public formGroup: DwFormGroup;
  public formLayout: DynamicFormLayout;
  public formModel: DynamicTableModel[];
  loading: boolean = false;
  modal: any;
  subs: Subscription = new Subscription();
  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    private messageService: NzMessageService,
    private pccRiskDetailMaintenanceService: PccRiskDetailMaintenanceService,
    private formService: DynamicFormService,
    private athModalService: AthModalService,
    public wbsService: DynamicWbsService,
    private userService: DwUserService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  init({ pageData = {}, modalTitle = '' }: ModalOption) {
    this.pccRiskDetailMaintenanceService.content = this.model?.content || {};
    this.initDynamicCop(pageData);
    this.createModal(modalTitle);
  }

  initDynamicCop(pageData) {
    const source = this.pccRiskDetailMaintenanceService.getJSONTemplate(pageData);
    source.layout = Array.isArray(source?.layout) ? source.layout : [];
    source.content = source.content || {};
    const initializedData = this.formService.initData(
      source.layout as any,
      source.pageData,
      source.rules as any,
      source.style,
      source.content
    );
    this.formLayout = initializedData.formLayout; // 样式
    this.formModel = initializedData.formModel; // 组件数据模型
    this.formGroup = initializedData.formGroup; // formGroup
  }

  showModal(option?: ModalOption) {
    const { pageData = {}, modalTitle = '' } = option || {};
    this.init({ pageData: new DataModel.RiskMaintenance(pageData), modalTitle });
  }
  closeModal() {
    this.modal.close();
  }
  onCancel() {
    this.modal.close();
  }
  onConfirm() {
    if (!this.formGroup.valid) {
      this.generateControl(this.formGroup);
      return;
    }
    this.confirm.emit({
      ...(this.formGroup.get('riskDetailMaintenance') as DwFormGroup).getRawValue(),
      project_no: this.wbsService.riskMaintenanceProjectInfo.project_no,
    });
    this.closeModal();
  }
  getChanges(e) {}
  private createModal(title) {
    this.modal = this.athModalService.create({
      nzTitle: title,
      nzContent: this.modalBody,
      nzClosable: false,
      nzWidth: '50%',
      nzAutofocus: null,
      nzFooter: this.modalFooter,
      nzMaskClosable: false,
      nzKeyboard: false,
    });
  }
  generateControl(group: DwFormGroup) {
    const v: any = Object.entries((group.get('riskDetailMaintenance') as DwFormGroup).controls);
    for (const [key, _group] of v) {
      _group.markAsDirty();
      _group.updateValueAndValidity();
    }
  }
}
