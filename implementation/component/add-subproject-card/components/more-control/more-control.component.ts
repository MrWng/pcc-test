import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { cloneDeep } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'app/implementation/service/common.service';

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
  /** 单别list */
  docTypeNoList: any[] = [];
  /** 任务模版信息 */
  @Input() taskTemplateInfo = { task_category: '' };
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
    return this.addSubProjectCardService.isPreview || this.addSubProjectCardService.currentCardInfo?.isCollaborationCard;
  }

  /**
   * todo:特定的任务类型
   * 清空、置灰
   * 单别条件值
   */
  get isForbiddenForDocTypeInfo() {
    /**
     * 隐藏：
     * ORD.一般
     * 置灰：
     * ODAR.订单帐款分期；PLM.PLM工作项；PLM_PROJECT.PLM项目；MES.MES；ASSC_ISA_ORDER.售后云安调工单；
     * APC.装配进度(工单)；APC_O.装配进度(工单工艺)；SFT.SFT；MO_H.工单(工时)；REVIEW.项目检讨；
     * 可用：
     * MO.工单；PO.采购；OD.订单；MOOP.工单工艺；EXPORT.出货通知单；SHIPMENT.出货单；PR.请购；
     * PRSUM.请购(汇总)；POSUM.采购(汇总)；POPUR.采购进货明细；PO_KEY.采购(关键料)；PO_NOT_KEY.采购(关键料)；MOMA.工单发料；
     */
    const flag1 = this.addSubProjectCardService.isPreview; // true，置灰
    const flag2 = this.addSubProjectCardService.currentCardInfo?.isCollaborationCard === true; // 置灰
    const flag3 = Number(this.validateForm.value.task_status) !== 10; // 置灰
    // 置灰
    const flag4 = ['ODAR','PLM','PLM_PROJECT','MES','ASSC_ISA_ORDER','APC','APC_O','SFT','MO_H','REVIEW', 'PCM']
      .includes(this.taskTemplateInfo?.task_category);
    // 可用
    // const flag5 = ['MO','PO','OD','MOOP','EXPORT','SHIPMENT','PR','PRSUM','POSUM','POPUR','PO_KEY','PO_NOT_KEY','MOMA']
    //   .includes(this.taskTemplateInfo?.task_category);
    if (flag1 || flag2 || flag3 || flag4) {
      this.validateForm.controls['doc_type_info'].disable();
      return true;
    } else {
      this.validateForm.controls['doc_type_info'].enable();
      return false;
    }
  }

  ngOnInit(): void {
    if (this.addSubProjectCardService.taskTemplateNo && Object.keys(this.addSubProjectCardService.currentCardInfo).length) {
      this.setDocTypeInfoList(this.addSubProjectCardService.currentCardInfo);
      this.setDocTypeNoList(this.addSubProjectCardService.currentCardInfo);
      this.setItemType(this.addSubProjectCardService.currentCardInfo);
      this.resetBRegionValue(this.addSubProjectCardService.currentCardInfo.task_category);
      if ((this.validateForm.get('is_need_doc_no').value === true)
      && (this.addSubProjectCardService.currentCardInfo.task_status === '20') && !this.addSubProjectCardService.isPreview) {
        const enableColumn = ['doc_type_no', 'doc_no', 'seq', 'type_condition_value', 'sub_type_condition_value'];
        enableColumn.forEach((column) => { this.validateForm.get(column).enable(); });
        if (this.addSubProjectCardService.currentCardInfo.task_category === 'MO_H') {
          this.validateForm.get('outsourcing_condition_value').enable();
        }
      }
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
   * todo:特定的任务类型
   * 清空、置灰
   * 运营编号、据点编号、运营编号、
   * 单别条件值、品号类别/群组、品号类别条件值、
   * 料号运算符、料号条件值、序号
   * @param taskCategory
   */
  resetBRegionValue(taskCategory: string): void {
    if (['ODAR', 'REVIEW', 'PLM', 'MES', 'PLM_PROJECT', 'ASSC_ISA_ORDER', 'PCM'].includes(taskCategory)) {
      this.resetBAreaData();
    }
    this.eocMapDisabled = ['PLM', 'PLM_PROJECT', 'ASSC_ISA_ORDER', 'PCM'].includes(taskCategory) ? true : false;
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
    // 单别条件值
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
   * 设置更多选项中单别
   * @param taskTemplate
   * @returns
   */
  setDocTypeNoList(taskTemplate: any): void {
    const docType = this.transferTaskCategoryNo(taskTemplate.task_category);
    if (!docType) { return; }
    // 单别
    const paramsDoc = {
      doc_type: 14,
      eoc_company_id: taskTemplate.eoc_company_id || '',
      eoc_site_id: taskTemplate.eoc_site_id || '',
      eoc_region_id: taskTemplate.eoc_region_id || '',
    };
    const docEcoMap = taskTemplate.eoc_company_id;
    this.commonService
      .getInvData('bm.dnsc.document.type.get', paramsDoc, docEcoMap)
      .subscribe((res: any): void => {
        this.changStatus.emit({ type: 'loading', value: false });
        this.docTypeNoList = res.data.document.map(item=>{
          item.docTypeLabel = item.doc_type_no + item.doc_type_name;
          return item;
        });
        this.changeRef.markForCheck();
      });
  }

  /**
   * 设置更多选项中品號類別/群組数组
   * @param taskTemplate
   * @returns
   */
  setItemType(taskTemplate: any): void {
    if (['PLM', 'MES', 'PLM_PROJECT', 'REVIEW', 'APC', 'APC_O', 'ASSC_ISA_ORDER', 'PCM'].includes(taskTemplate.task_category)) {
      this.changStatus.emit({ type: 'loading', value: false });
      return;
    }

    // 是否依赖地端
    this.commonService.hasDependsGround().toPromise().then((result) => {
      // 同步稳态	Y.同步；N.不同步
      if (result?.data?.hasGroundEnd === 'Y') {
        // sprint 4.6 product.classification.definition.data.get => bm.pisc.product.classification.get todo spring 4.8
        this.commonService
          .getInvData('bm.pisc.product.classification.get', {}, taskTemplate.eoc_company_id)
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
   * 【单别条件值】需要调API
   * 根据任务类型 返回一个编号
   * @param taskCategory 任务类型
   * @returns
   */
  transferTaskCategory(taskCategory: string): any {
    const transferInfo = {
      MO: 14,
      PO: 4,
      OD: 9,
      // ODAR: 9,
      MOOP: 14,
      EXPORT: 15,
      SHIPMENT: 10,
      PR: 13,
      PRSUM: 13,
      POSUM: 4,
      POPUR: 4,
      MOMA: 14,
      PO_KEY: 4,
      PO_NOT_KEY: 4,
    };
    return transferInfo[taskCategory];
  }

  /**
   * 【单别】需要调API
   * 根据任务类型 返回一个编号
   * @param taskCategory 任务类型
   * @returns
   */
  transferTaskCategoryNo(taskCategory: string): any {
    const transferInfo = ['PRSUM','POSUM','MO_H','MOOP','APC','APC_O','SFT'];
    return transferInfo.includes(taskCategory);
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
