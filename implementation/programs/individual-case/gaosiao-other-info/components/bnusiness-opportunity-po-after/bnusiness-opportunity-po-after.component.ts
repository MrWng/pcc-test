import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { DwFormGroup, generateControl } from '@athena/dynamic-core';
import { GaosiaoOtherInfoService } from '../../gaosiao-other-info.service';

@Component({
  selector: 'app-bnusiness-opportunity-po-after',
  templateUrl: './bnusiness-opportunity-po-after.component.html',
  styleUrls: ['./bnusiness-opportunity-po-after.component.less'],
})
export class BnusinessOpportunityPoAfterComponent implements OnInit {
  @Input() group: DwFormGroup;
  @Input() subsidiaryParameters: any = {};
  get opportunityPaymentTypeCtrs() {
    return this.templateGroup.get('payment_type_info')['controls'] || [];
  }
  defaultTopTableRows = 6;
  groupTemplate: any = {
    confirm_risk_level: '1',
    is_confirm: '2',
    payment_type_info: [],
  };
  templateGroup = new DwFormGroup({});
  constructor(public gOtherInfoService: GaosiaoOtherInfoService) {}

  ngOnInit(): void {
    this.addControlIntoGroup();
  }
  addControlIntoGroup() {
    this.initTopTableData();
    Object.keys(this.groupTemplate).forEach((key) => {
      const value = this.groupTemplate[key];
      const ctr = generateControl(value);
      this.group.addControl(key, ctr);
      this.templateGroup.addControl(key, ctr);
    });
  }
  initTopTableData() {
    // 默认6行
    for (let i = 0; i < this.defaultTopTableRows; i++) {
      this.groupTemplate.payment_type_info.push({
        payment_type: i + 1 + '',
        risk_level_of_repayment: '1',
        risk_confirmation_date: null,
        project_no: this.subsidiaryParameters.project_no,
      });
    }
  }
  test(e) {
    console.log(e, 'sss');
  }
}
