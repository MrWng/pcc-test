import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  DwFormArray,
  DwFormControl,
  DwFormGroup,
  generateControl,
  isEmpty,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-clue-information',
  templateUrl: './clue-information.component.html',
  styleUrls: ['./clue-information.component.less'],
})
export class ClueInformationComponent implements OnInit {
  @Input() group: DwFormGroup;
  @Input() subsidiaryParameters: any = {};
  private defaultTopTableRows: number = 5;
  templateGroup = new DwFormGroup({});
  get opportunityCustomerContactCtrs() {
    return this.templateGroup.get('customer_contact_info')['controls'] || [];
  }
  projectSourceOptions: any[] = [
    {
      label: this.translateService.instant('dj-pcc-自主开发'),
      value: '1',
    },
    {
      label: this.translateService.instant('dj-pcc-公司提供信息后开发'),
      value: '2',
    },
    {
      label: this.translateService.instant('dj-pcc-公司已进行技术、商务对接等工作，业务进行跟单'),
      value: '3',
    },
    {
      label: this.translateService.instant('dj-pcc-中介或者第三方'),
      value: '4',
    },
  ];
  private groupTemplate: any = {
    customer_contact_info: [],
    background: '',
    project_source: '1',
    is_transfer_business_opportunities: '2',
    target_inside_or_outside: '1',
  };
  constructor(private translateService: TranslateService, private fb: FormBuilder) {}

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
    // 默认5行
    for (let i = 0; i < this.defaultTopTableRows; i++) {
      this.groupTemplate.customer_contact_info.push({
        customer_name: '',
        contact_rank: '',
        contact_info: '',
        project_no: this.subsidiaryParameters.project_no,
        seq: i + 1,
      });
    }
  }
  addRow() {
    const occFormArr = this.group.get('customer_contact_info') as DwFormArray;
    const lastSeq = occFormArr.controls[occFormArr.controls.length - 1].get('seq').value;
    occFormArr.push(
      generateControl({
        customer_name: '',
        contact_rank: '',
        contact_info: '',
        project_no: this.subsidiaryParameters.project_no,
        seq: lastSeq + 1,
      })
    );
  }
  removeRow(i: number) {
    const occFormArr = this.group.get('customer_contact_info') as DwFormArray;
    occFormArr.removeAt(i);
    occFormArr.controls.forEach((group, index) => {
      group.get('seq').setValue(index + 1);
    });
  }
}
