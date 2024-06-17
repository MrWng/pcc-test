import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  ChangeDetectorRef,
  Input,
  SimpleChanges,
} from '@angular/core';
import { isNotEmpty, multiple, isEmpty, isNumber, isString } from '@athena/dynamic-core';
import { CommonService } from '../../../../service/common.service';
import { DynamicWbsService } from '../../../wbs/wbs.service';
@Component({
  selector: 'app-accounts-periodization',
  templateUrl: './accounts-periodization.component.html',
  styleUrls: ['./accounts-periodization.component.less'],
})
export class AccountsPeriodizationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() tabName: String;
  @Input() projectInfo = null;
  order_info: any;
  isTaxIncluded: boolean = false;

  constructor(
    public commonService: CommonService,
    public wbsService: DynamicWbsService,
    private changeRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tabName === 'app-accounts-periodization') {
      const projectInfo = changes?.projectInfo?.currentValue ?? this.projectInfo;
      if (projectInfo && Object.keys(projectInfo).length) {
        if (projectInfo.project_set_no) {
          // getAccountInfoRule 获取账款分期规则 参数名
          this.commonService.getMechanismParameters('getAccountInfoRule').subscribe((result) => {
            // 项目编号=若当前项目的 项目集编号 不为空 且 交付设计器的参数.获取账款分期信息规则=1.依项目集编号，传入项目集编号，否则传入当前项目编号
            const project_no = result?.data?.getAccountInfoRule === '1' ?
              projectInfo.project_set_no : projectInfo.project_no ?? this.wbsService.project_no;
            this.getPageData(project_no);
          });
        } else {
          this.getPageData(projectInfo.project_no ?? this.wbsService.project_no);
        }
      }
    }
  }

  ngOnDestroy(): void { }

  getPageData(project_no): void {
    if (project_no) {
      const params = {
        project_info: [{ project_no: project_no }]
        // query_condition: '2',// sprint 4.6新增字段
      };
      // sprint 4.6 project.order.instalment.info.process => bm.pisc.project.order.detail.instalment.get todo 规格问题暂时不改了
      this.commonService
        .getInvData('project.order.instalment.info.process', params)
        .subscribe((res: any): void => {
          this.order_info = res.data.order_info[0];
          if (this.order_info?.contract_trans_curr_amount) {
            this.order_info.contract_trans_curr_amount = this.transform(
              this.order_info?.contract_trans_curr_amount
            );
          }
          this.isTaxIncluded = this.order_info?.is_tax_included || false;
          this.order_info?.instalment_info.forEach((item: any): void => {
            item.instalment_rate = multiple(item.instalment_rate, 100);
            item.instalment_trans_curr_amount = this.transform(item.instalment_trans_curr_amount);
          });
          this.changeRef.markForCheck();
        });
    }
  }

  transform(
    value: any,
    thousandthPercentile: boolean = true,
    centsNumber?: number,
    rounding?: number,
    currency?: any
  ): any {
    if (isEmpty(value) || value === '—' || value === '——' || value === '-') {
      return '—';
    }
    if (!thousandthPercentile) {
      return value;
    }
    if (isString(value) && Number.isNaN(Number(value))) {
      return value;
    }
    value = isString(value) ? Number(value) : value;
    const isNegative = value < 0;
    // rounding = 1： 四舍五入的情况下直接处理小数点
    if (rounding === 1) {
      value = value.toFixed(centsNumber);
    }
    value = value.toString().replace('-', '');
    // 正则判断是否为数字
    const regex = /\d+/i;
    if (value && regex.test(value)) {
      // 如果存在小数点，则获取数字的小数部分
      let cents = value.indexOf('.') > 0 ? value.substr(value.indexOf('.')) : '';
      // 不四舍五入的情况下，截取小数点
      cents = rounding !== 1 && isNumber(centsNumber) ? cents.substring(0, centsNumber + 1) : cents;
      // 获取数字的整数数部分
      value = value.indexOf('.') > 0 ? value.substring(0, value.indexOf('.')) : value;
      // 计算分隔几个千分位
      const places = Math.ceil(value.length / 3);
      // 把左侧不够的用空格补齐，后面会去除
      value = value.padStart(places * 3);
      const integerValArr = [];
      for (let i = places; i > 0; i--) {
        integerValArr.unshift(value.substring((i - 1) * 3, i * 3).trim());
      }
      value = (isNegative ? '-' : '') + integerValArr.join(',') + cents;
    }
    return isNotEmpty(currency) && isNotEmpty(value) ? currency + value : value;
  }
}