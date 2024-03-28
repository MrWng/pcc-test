import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  DynamicFormLayoutService,
  DynamicFormValidationService,
  isEmpty,
} from '@athena/dynamic-core';
import { CommonService } from '../../service/common.service';
import { OpenWindowService } from '@athena/dynamic-ui';
import { TranslateService } from '@ngx-translate/core';
import { APIService } from '../../service/api.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-dynamic-mo-process-assignment',
  templateUrl: './standard-working-hours.component.html',
  styleUrls: ['./standard-working-hours.component.less'],
})
export class StandardWorkingHoursComponent implements OnInit {
  toFixed: string = 'toFixed';
  subs: Subscription[] = [];
  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public wbsService: CommonService,
    public openWindowService: OpenWindowService,
    private translateService: TranslateService,
    public fb: FormBuilder,
    public apiService: APIService
  ) { }
  @Input() data: any;
  ngOnInit() {
    const isEdit = this.data._component.addSubProjectCardService.buttonType === 'EDIT';    // 工时系数
    const standardDaysControl = this.data.validateForm.get('standard_days');
    let standardDaysControlOldVal = standardDaysControl.value;
    const standardDaysSub = standardDaysControl.valueChanges.subscribe((res) => {
      if (standardDaysControlOldVal !== res) {
        standardDaysControlOldVal = res;
        this.calcStandardWorkHoursVal();
      }
    });
    // 主单位
    const mainUnitControl = this.data.validateForm.get('plan_main_unit_value');
    let mainUnitControlOldVal = mainUnitControl.value;
    const mainUnitSub = mainUnitControl.valueChanges.subscribe((res) => {
      if (mainUnitControlOldVal !== res) {
        mainUnitControlOldVal = res;
        this.calcStandardWorkHoursVal();
      }
    });
    // 难度
    const difficultyCoefficientControl = this.data.validateForm.get('difficulty_coefficient');
    let difficultyCoefficientControlOldVal = difficultyCoefficientControl.value;
    const difficultyCoefficientSub = difficultyCoefficientControl.valueChanges.subscribe((res) => {
      if (difficultyCoefficientControlOldVal !== res) {
        difficultyCoefficientControlOldVal = res;
        this.calcStandardWorkHoursVal();
      }
    });
    this.subs.push(standardDaysSub, mainUnitSub, difficultyCoefficientSub);
  }
  ngOnDestory() {
    this.subs.forEach((sub) => sub.unsubscribe());
  }
  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }
  standardWorkHoursChange() { }
  rerverseClick() {
    this.data._component.isHasRerverse = false;
  }
  calcStandardWorkHoursVal() {
    let mainUnitVal = this.data.validateForm.get('plan_main_unit_value').value,
      standardDaysVal = this.data.validateForm.get('standard_days').value,
      difficultyCoefficientVal = this.data.validateForm.get('difficulty_coefficient').value;
    mainUnitVal = isEmpty(mainUnitVal) ? 0 : mainUnitVal;
    standardDaysVal = isEmpty(standardDaysVal) ? 1 : standardDaysVal;
    const difficultyLevelNo = this.data.validateForm.get('difficulty_level_no').value;
    difficultyCoefficientVal =
      isEmpty(difficultyCoefficientVal) || isEmpty(difficultyLevelNo)
        ? 1
        : difficultyCoefficientVal;
    const val =
      mainUnitVal * standardDaysVal * (difficultyCoefficientVal < 0 ? 0 : difficultyCoefficientVal);

    this.data.validateForm
      .get('standard_work_hours')
      .setValue(parseFloat(this.customPrecisionFn(val, 2)));
  }
  customPrecisionFn(value: string | number, precision?: number) {
    const number = Number(value);
    if (isNaN(number) || number >= Math.pow(10, 21)) {
      return number.toString();
    }
    if (typeof precision === 'undefined' || precision === 0) {
      return Math.round(number).toString();
    }
    let result = number.toString();
    const numberArr = result.split('.');

    if (numberArr.length < 2) {
      // 整数的情况
      return padNum(result);
    }
    const intNum = numberArr[0]; // 整数部分
    const deciNum = numberArr[1]; // 小数部分
    const lastNum = deciNum.substr(precision, 1); // 最后一个数字

    if (deciNum.length === precision) {
      // 需要截取的长度等于当前长度
      return result;
    }
    if (deciNum.length < precision) {
      // 需要截取的长度大于当前长度 1.3.toFixed(2)
      return padNum(result);
    }
    // 需要截取的长度小于当前长度，需要判断最后一位数字
    result = `${intNum}.${deciNum.substr(0, precision)}`;
    if (parseInt(lastNum, 10) >= 5) {
      // 最后一位数字大于5，要进位
      const times = Math.pow(10, precision); // 需要放大的倍数
      let changedInt = Number(result.replace('.', '')); // 截取后转为整数
      changedInt++; // 整数进位
      changedInt /= times; // 整数转为小数，注：有可能还是整数
      result = padNum(`${changedInt}`);
    }
    return result;
    // 对数字末尾加0
    function padNum(num) {
      const dotPos = num.indexOf('.');
      if (dotPos === -1) {
        // 整数的情况
        num += '.';
        for (let i = 0; i < precision; i++) {
          num += '0';
        }
        return num;
      } else {
        // 小数的情况
        const need = precision - (num.length - dotPos - 1);
        for (let j = 0; j < need; j++) {
          num += '0';
        }
        return num;
      }
    }
  }
}
