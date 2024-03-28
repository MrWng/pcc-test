import { Inject, Injectable } from '@angular/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { CommonService } from '../../../service/common.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class SftTaskCardService {
  statusList1 = {
    '1': this.translateService.instant('dj-default-未生产'),
    '2': this.translateService.instant('dj-default-已发料'),
    '3': this.translateService.instant('dj-default-生产中'),
    Y: this.translateService.instant('dj-default-已完工'),
    y: this.translateService.instant('dj-default-指定完工'),
    N: this.translateService.instant('dj-default-未完工'),
  };
  statusList4 = {
    '1': this.translateService.instant('dj-default-厂内制程'),
    '2': this.translateService.instant('dj-default-托外制程'),
    '3': this.translateService.instant('dj-default-二者皆有'),
  };
  constructor(
    protected translateService: TranslateService,
    protected commonService: CommonService
  ) {
  }

  // 取得当前专案制令制程完工进度资料
  setTemplateJson(
    editable: boolean,
    responseData: Array<any>,
  ): any {
    let columns;
    if (editable) {
      columns = [
        {
          headerName: this.translateService.instant('dj-default-单别'),
          schema: 'doc_type_no',
          editable: true,
          showIcon: true,
        },
        {
          headerName: this.translateService.instant('dj-default-单号'),
          schema: 'doc_no',
          editable: true,
          showIcon: true,
        },
        {
          headerName: this.translateService.instant('dj-default-序号'),
          editable: true,
          showIcon: true,
          schema: 'seq',
        },
        {
          headerName: this.translateService.instant('dj-default-完成率'),
          schema: 'complete_rate',
        },
      ];
    } else {
      columns = [
        { headerName: this.translateService.instant('dj-default-状态码'), schema: 'status_code' },
        {
          headerName: this.translateService.instant('dj-default-生管人员'),
          schema: 'reporter_name',
        },
        { headerName: this.translateService.instant('dj-default-工单单号'), schema: 'wo_no' },
        {
          headerName: this.translateService.instant('dj-default-料号'),
          schema: 'item_no',
        },
        {
          headerName: this.translateService.instant('dj-default-品名规格'),
          schema: 'item_name_spec',
        },
        {
          headerName: this.translateService.instant('dj-default-生产数量'),
          schema: 'plan_qty',
        },
        {
          headerName: this.translateService.instant('dj-default-加工顺序'),
          schema: 'op_seq',
        },
        {
          headerName: this.translateService.instant('dj-default-制程代号'),
          schema: 'op_no',
        },
        { headerName: this.translateService.instant('dj-default-制程名称'), schema: 'op_name' },
        { headerName: this.translateService.instant('dj-default-性质'), schema: 'outsourcing_type' },
        {
          headerName: this.translateService.instant('dj-default-线别/厂商名称'),
          schema: 'supplier_name',
        },
        { headerName: this.translateService.instant('dj-default-投入数量'), schema: 'input_qty' },
        {
          headerName: this.translateService.instant('dj-default-完成数量'),
          schema: 'complete_qty',
        },
        { headerName: this.translateService.instant('dj-pcc-预计开工日'), schema: 'plan_start_date' },
        {
          headerName: this.translateService.instant('dj-default-非计划时程内'),
          schema: 'out_plan_time',
        },
        { headerName: this.translateService.instant('dj-pcc-预计完工日'), schema: 'plan_complete_date' },
        {
          headerName: this.translateService.instant('dj-pcc-实际开工日'),
          schema: 'actual_start_date',
        },
        {
          headerName: this.translateService.instant('dj-pcc-实际完工日'),
          schema: 'actual_complete_date',
        },
        {
          headerName: this.translateService.instant('dj-default-完成率'),
          schema: 'complete_rate',
        },
      ];
    }
    const taskCategoryLayout = [
      {
        id: 'inquiry',
        type: 'GRID_TABLE',
        schema: 'inquiry',
        editable: true,
        columnDefs: this.commonService.getLayout(columns),
        allFields: this.commonService.getAllFields(columns),
        details: [],
      },
    ];
    const data = {
      layout: taskCategoryLayout,
      pageData: {
        inquiry: responseData,
      },
      content: {
        pattern: 'DATA_ENTRY',
        category: 'SIGN-DOCUMENT',
      },
      rules: [
        {
          schema: 'price',
          path: 'inquiry',
          condition: 'true',
          key: 'required',
          scope: 'EDIT',
        },
      ],
      style: {},
    };
    return data;
  }

  translatePccWord(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
