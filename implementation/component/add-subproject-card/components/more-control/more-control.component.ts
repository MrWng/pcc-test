import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { cloneDeep } from '@ng-dynamic-forms/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'app/customization/task-project-center-console/service/common.service';

import { AddSubProjectCardService } from '../../add-subproject-card.service';


@Component({
  selector: 'app-more-control',
  templateUrl: './more-control.component.html',
  styleUrls: ['./more-control.component.less']
})
export class MoreControlComponent implements OnInit {
  /** 禁用公司编号 */
  @Input() eocMapDisabled?: boolean
  /** 单别条件值list */
  docTypeInfoList: any[] = [];
  /** 品号类别/群组list */
  listOfItemType: any[] = [];

  @Input() validateForm: FormGroup = this.fb.group({
    /** 单别信息 */
    doc_type_info: [{ doc_condition_value: '' }],
    /** 品号类别/群组 */
    item_type: [''],
    /** 品号类别条件值 */
    item_type_value: [''],
    /** 料号运算符 */
    item_operator: [''],
    /** 料号条件值 */
    item_condition_value: [''],
    /** 单别 */
    doc_type_no: [''],
    /** 单号 */
    doc_no: [''],
    /** 序号 */
    seq: [''],
    /** 类型条件值 */
    type_condition_value: [{ value: '', disabled: true }],
    /** 次类型条件值 */
    sub_type_condition_value: [{ value: '', disabled: true }],
    /** 托外条件值 */
    outsourcing_condition_value: [{ value: '', disabled: true }],
  });

  @Output() onEocChange = new EventEmitter()
  @Output() changStatus = new EventEmitter()


  /** 更多收起按钮 */
  foldContent: string = this.translateService.instant('dj-default-更多');
  /** 更多收起按钮的展开/折叠状态 */
  foldStatus: boolean = true;
  /** 料号运算符 */
  listOfItemOperator: any[] = [
    { label: '=', value: 'equal' },
    { label: '≥', value: 'greater_equal' },
    { label: '≤', value: 'less_equal' },
    { label: '>', value: 'greater' },
    { label: '<', value: 'less' },
    { label: '<>', value: 'not_equal' },
    { label: '%like%', value: 'l_like_r' },
    { label: 'like%', value: 'like_r' },
    { label: '%like', value: 'l_like' },
  ];

  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private fb: FormBuilder,
    public commonService: CommonService,
  ) { }

  /**
   * 不禁用状态
   */
  get isForbidden() {
    return this.addSubProjectCardService.currentCardInfo?.isCollaborationCard;
  }

  ngOnInit(): void {
    if (this.addSubProjectCardService.taskTemplateNo && Object.keys(this.addSubProjectCardService.currentCardInfo).length) {
      this.setDocTypeInfoList(this.addSubProjectCardService.currentCardInfo);
      this.setItemType(this.addSubProjectCardService.currentCardInfo);
      this.resetBRegionValue(this.addSubProjectCardService.currentCardInfo.task_category);
    }

    this.checkItemOperator();
  }


  /**
   * 校验料号条件符号
   */
  checkItemOperator(): void {
    this.validateForm.get('item_condition_value')?.valueChanges.subscribe((value) => {
      if (!value) {
        this.validateForm.get('item_operator').setValidators(null);
        this.validateForm.get('item_operator').clearValidators();
        this.validateForm.get('item_operator').updateValueAndValidity();
      } else {
        this.validateForm.get('item_operator').setValidators([Validators.required]);
        this.validateForm.get('item_operator').updateValueAndValidity();
      }
    });
  }

  /**
   * 更改更多收起状态
   */
  changeFoldStatus(): void {
    this.foldStatus = !this.foldStatus;
    this.foldContent = this.foldStatus
      ? this.translateService.instant(`dj-default-更多`)
      : this.translateService.instant(`dj-default-收起`);
  }

  /**
   * 获取公司编号、运营编号和据点编号
   * @param currentEocInfo
   */
  currentEocInfo(currentEocInfo: any): void {
    const tempEocCompanyId = cloneDeep(this.addSubProjectCardService.eocCompanyId)?.id || '';
    const tempEocSiteId = cloneDeep(this.addSubProjectCardService.eocSiteId)?.id || '';
    const tempEocRegionId = cloneDeep(this.addSubProjectCardService.eocRegionId)?.id || '';
    this.addSubProjectCardService.eocCompanyId =
      currentEocInfo.length > 0 ? currentEocInfo[0] : '—';
    this.addSubProjectCardService.eocSiteId = currentEocInfo.length > 1 ? currentEocInfo[1] : '—';
    this.addSubProjectCardService.eocRegionId = currentEocInfo.length > 2 ? currentEocInfo[2] : '—';
    const eocCompanyId = this.addSubProjectCardService.eocCompanyId?.id || '';
    const eocSiteId = this.addSubProjectCardService.eocSiteId?.id || '';
    const eocRegionId = this.addSubProjectCardService.eocRegionId?.id || '';
    if (
      eocCompanyId !== tempEocCompanyId ||
      eocSiteId !== tempEocSiteId ||
      eocRegionId !== tempEocRegionId
    ) {
      this.addSubProjectCardService.validateForm.controls['doc_type_info'].patchValue([{ doc_condition_value: '' }]);
      this.addSubProjectCardService.validateForm.controls['item_type'].patchValue('');
    }
    if (currentEocInfo.length !== 0) {
      this.onEocChange.emit(currentEocInfo);
    }
  }

  /**
   * todo:特定的任务类型时 清空一些值
   * @param taskCategory
   */
  resetBRegionValue(taskCategory: string): void {
    if (['ODAR', 'REVIEW', 'PLM', 'MES', 'PLM_PROJECT'].includes(taskCategory)) {
      this.resetBAreaData();
    }
    this.eocMapDisabled = ['PLM', 'PLM_PROJECT'].includes(taskCategory) ? true : false;
  }

  /**
   * 重置更多内表单的值
   */
  resetBAreaData(): void {
    const resetList = [
      'item_type',
      'item_type_value',
      'item_operator',
      'item_condition_value',
      'doc_type_no',
      'doc_no',
      'type_condition_value',
      'sub_type_condition_value',
      'outsourcing_condition_value',
    ];
    Object.keys(this.addSubProjectCardService.validateForm.getRawValue()).forEach(
      (control: string): void => {
        if (control === 'doc_type_info') {
          this.addSubProjectCardService.validateForm.get('doc_type_info').patchValue([{ doc_condition_value: '' }]);
          this.addSubProjectCardService.validateForm.get('doc_type_info').disable();
        }
        if (resetList.includes(control)) {
          this.addSubProjectCardService.validateForm.get(control).patchValue('');
          this.addSubProjectCardService.validateForm.get(control).disable();
        }
      }
    );
    this.addSubProjectCardService.validateForm.get('is_need_doc_no').patchValue(false);
  }

  /**
   * 设置更多选项中单别条件值
   * @param taskTemplate
   * @returns
   */
  setDocTypeInfoList(taskTemplate: any): void {
    const docType = this.transferTaskCategory(taskTemplate.task_category);
    if (!docType) { return; }
    const params = {
      doc_type: docType,
      eoc_company_id: taskTemplate.eoc_company_id || '',
      eoc_site_id: taskTemplate.eoc_site_id || '',
      eoc_region_id: taskTemplate.eoc_region_id || '',
    };
    const ecoMap = taskTemplate.eoc_company_id;
    this.commonService
      .getInvData('bm.dnsc.document.type.get', params, ecoMap)
      .subscribe((res: any): void => {
        this.changStatus.emit({ type: 'loading', value: false });
        this.docTypeInfoList = res.data.document;
        this.changeRef.markForCheck();
      });
  }

  /**
   * 设置更多选项中品號類別/群組数组
   * @param taskTemplate
   * @returns
   */
  setItemType(taskTemplate: any): void {
    if (['PLM', 'MES', 'PLM_PROJECT', 'REVIEW', 'APC', 'APC_O'].includes(taskTemplate.task_category)) {
      this.changStatus.emit({ type: 'loading', value: false });
      return;
    }

    // 是否依赖地端
    this.commonService.hasDependsGround().toPromise().then((result) => {
      // 同步稳态	Y.同步；N.不同步
      if (result?.data?.hasGroundEnd === 'Y') {
        this.commonService
          .getInvData('product.classification.definition.data.get', {}, taskTemplate.eoc_company_id)
          .subscribe((res: any): void => {
            this.changStatus.emit({ type: 'loading', value: false });
            res.data.classification_method_info.forEach((info: any): void => {
              info.value = info.classification_method_no;
              info.label = info.classification_method_name;
            });
            this.listOfItemType = res.data.classification_method_info;
            this.changeRef.markForCheck();
          });
      }
    });

  }

  /**
   * 根据任务类型 返回一个编号
   * @param taskCategory 任务类型
   * @returns
   */
  transferTaskCategory(taskCategory: string): any {
    const transferInfo = {
      MO: 14,
      PO: 4,
      OD: 9,
      ODAR: 9,
      MOOP: 14,
      EXPORT: 15,
      SHIPMENT: 10,
      PR: 13,
      PRSUM: 13,
      POSUM: 4,
      POPUR: 4,
      MOMA: 14,
      PO_KEY: 4,
    };
    return transferInfo[taskCategory];
  }

  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  /**
 * html 中文字翻译
 * @param val
 */
  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }


}
