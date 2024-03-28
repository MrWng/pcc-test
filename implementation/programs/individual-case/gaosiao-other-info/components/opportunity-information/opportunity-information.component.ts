import { Component, Input, OnInit } from '@angular/core';
import { DwFormGroup, generateControl, isEmpty } from '@athena/dynamic-core';
import { GaosiaoOtherInfoService } from '../../gaosiao-other-info.service';

@Component({
  selector: 'app-opportunity-information',
  templateUrl: './opportunity-information.component.html',
  styleUrls: ['./opportunity-information.component.less'],
})
export class OpportunityInformationComponent implements OnInit {
  @Input() group: DwFormGroup;
  @Input() subsidiaryParameters: any = {};
  templateGroup = new DwFormGroup({});
  private groupTemplate: any = {
    customer_budget: null,
    estimated_po_date: null,
    estimated_move_in_date: null,
    competitors: '',
    pre_purchase_price: null,
    order_acceptance_probability: '',
    sales_strategy: '',
    sales_process_records: '',
    next_step_plan: '',
  };
  constructor(public gOtherInfoService: GaosiaoOtherInfoService) {}

  ngOnInit(): void {
    this.addControlIntoGroup();
  }
  addControlIntoGroup() {
    Object.keys(this.groupTemplate).forEach((key) => {
      const value = this.groupTemplate[key];
      const ctr = generateControl(value);
      this.group.addControl(key, ctr);
      this.templateGroup.addControl(key, ctr);
    });
  }
}
