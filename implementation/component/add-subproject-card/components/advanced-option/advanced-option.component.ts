import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Entry } from 'app/customization/task-project-center-console/service/common.service';
import { DynamicCustomizedService } from 'app/customization/task-project-center-console/service/dynamic-customized.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AddSubProjectCardService } from '../../add-subproject-card.service';
import { AdvancedOptionService } from '../../services/advanced-option.service';
import { TaskTemplateService } from '../../services/task-template.service';

@Component({
  selector: 'app-advanced-option',
  templateUrl: './advanced-option.component.html',
  styleUrls: ['./advanced-option.component.less']
})
export class AdvancedOptionComponent implements OnInit {
  @Input() source: Entry = Entry.card;
  @Input() taskStatus: Number = null;

  @Input() validateForm: FormGroup = this.fb.group({
    /** 主单位	0.无 1.工时 2.重量 3.张数 4.数量 5.项数 */
    main_unit: ['0'],
    /** 次单位	0.无 1.工时 2.重量 3.张数 4.数量 5.项数 */
    second_unit: ['0'],
    /** 预计值(主单位) */
    plan_main_unit_value: '',
    /** 预计值(次单位) */
    plan_second_unit_value: '',
    /** 标准工时 */
    standard_work_hours: '',
    /** 标准天数 */
    standard_days: '',
  });

  Entry = Entry;
  /** 进阶选项，组件，展开收起状态 */
  advancedTaskStatus: boolean = false;
  /** 乾冶标准工时推算组件 */
  qianyeStandWorkHourDynamicModel: any;
  isHasRerverse: boolean;
  unitDisabled: boolean
  planUnitDisabled: boolean;
  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    protected changeRef: ChangeDetectorRef,
    private messageService: NzMessageService,
    private translateService: TranslateService,
    private taskTemplateService: TaskTemplateService,
    private dynamicCustomizedService: DynamicCustomizedService,
    public advancedOptionService: AdvancedOptionService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initIndividualCaseComp();
    this.unitDisabled = this.source === Entry.card && this.taskStatus > 10;
  }

  /**
   * 初始化个案
   */
  initIndividualCaseComp() {
    const curTenantId = JSON.parse(window.sessionStorage.getItem('DwUserInfo')).tenantId;
    // 乾冶标准工时推算组件
    this.qianyeStandWorkHourDynamicModel = this.dynamicCustomizedService.getComponent({
      tenantIdComponent: curTenantId + '-standard-working-hours',
      validateForm: this.addSubProjectCardService.validateForm,
      // disabled: this.source === this.Entry.card && this.taskStatus > 10 ? true : false,
      _component: this,
    });
  }


  /**
   * 进阶选项，展开/收起
   */
  changeAdvancedTaskStatus(): void {
    this.advancedTaskStatus = !this.advancedTaskStatus;
  }


  /**
   * 进阶选项-主单位-预计值 是否置灰
   * @param data
   */
  getMainUnitValid() {
    return (
      this.addSubProjectCardService.validateForm.value.main_unit === undefined ||
      this.addSubProjectCardService.validateForm.value.main_unit === '0'
    );
  }

  /**
   * 进阶选项-主次单位 下拉选择变化回调
   * @param $event
   * @param type main_unit：主单位，second_unit：次单位
   */
  changeSelect($event: any, type): void {
    if (!this.addSubProjectCardService.taskTemplateName) {
      if (type === 'main_unit') {
        if ($event === '0') {
          this.advancedOptionService.planMainUnitValue = false;
          this.validateForm.get('plan_main_unit_value').patchValue(null);
          this.validateForm.get('plan_main_unit_value').disable(); // 预计值（主单位）
        } else {
          this.validateForm.get('plan_main_unit_value').enable();
        }
      }
      if (type === 'second_unit') {
        if ($event === '0') {
          this.advancedOptionService.planSecondUnitValue = false;
          this.validateForm.get('plan_second_unit_value').patchValue(null);
          this.validateForm.get('plan_second_unit_value').disable(); // 预计值（次单位）
        } else {
          this.validateForm.get('plan_second_unit_value').enable();
        }
      }
    }
  }

  /**
   * 进阶选项-主单位-预计值 发生变化
   * @param data
   */
  changePlanMainUnitValue(data: any) {
    if (
      !this.addSubProjectCardService.taskTemplateName &&
      this.addSubProjectCardService.validateForm.value.main_unit !== '0'
    ) {
      if (data === '' || !(data > 0)) {
        this.advancedOptionService.planMainUnitValue = true;
      } else {
        this.advancedOptionService.planMainUnitValue = false;
      }
    }
  }

  /**
   * 进阶选项-次单位-预计值 是否置灰
   * @param data
   */
  getSecondUnitValid() {
    return (
      this.addSubProjectCardService.validateForm.value.second_unit === undefined ||
      this.addSubProjectCardService.validateForm.value.second_unit === '0'
    );
  }


  /**
   * 进阶选项-次单位-预计值 发生变化
   * @param data
   */
  changePlanSecondUnitValue(data: any) {
    if (
      !this.addSubProjectCardService.taskTemplateName &&
      this.addSubProjectCardService.validateForm.value.second_unit !== '0'
    ) {
      if (data === '' || !(data > 0)) {
        this.advancedOptionService.planSecondUnitValue = true;
      } else {
        this.advancedOptionService.planSecondUnitValue = false;
      }
    }
  }

  /**
   * 标准天数 = 标准工时/8
   * @param data
   * @returns
   */
  standardWorkHoursChange(data: any): void {
    if (isNaN(data)) {
      return;
    }
    if (data > 0) {
      this.validateForm.get('standard_days').patchValue((data / 8).toFixed(1));
    } else {
      this.validateForm.get('standard_days').patchValue(0);
    }
    this.changeRef.markForCheck();
  }

  /**
   * 主单位 或 次单位
   * 当显示错误提示时，增高行高
   */
  showErrorTip(): boolean {
    return this.advancedOptionService.planMainUnitValue || this.advancedOptionService.planSecondUnitValue;
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
