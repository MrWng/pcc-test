import { Injectable } from '@angular/core';
import { BaseDynamicCompBuilder } from 'app/implementation/class/DynamicCom';
import { ProblemHandlingService } from '../../problem-handling.service';
import { DynamicFormService } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { PccProblemHandlingService } from '../../../../pcc-problem-handling.service';
import { CommonService } from 'app/implementation/service/common.service';
import { CreateDynamicFormCopService } from 'app/implementation/service/create-dynamic-form-cop.setvice';
import { CreateDynamicCopRulesService } from 'app/implementation/service/create-dynamic-cop-rules.service';
import { CreateDynamicTableCopService } from 'app/implementation/service/create-dynamic-table-cop.setvice';
import { ProblemExecutionMethod } from '../../../../config';

@Injectable()
export class IssueJourneyDetailsTableService extends BaseDynamicCompBuilder {
  // 记录机制的content参数
  content: any;
  tableId: string = 'issueBaseInfoForm';

  constructor(
    public commonService: CommonService,
    public createDynamicFormCopService: CreateDynamicFormCopService,
    public problemHandlingService: ProblemHandlingService,
    public createDynamicCopRulesService: CreateDynamicCopRulesService,
    public formService: DynamicFormService,
    private translateService: TranslateService,
    public createDynamicTableCopService: CreateDynamicTableCopService,
    private pccProblemHandlingService: PccProblemHandlingService
  ) {
    super(formService, createDynamicFormCopService, createDynamicTableCopService);
  }
  generateDynamicCop(pageData = [], editable = true) {
    const id = this.tableId;
    return this.initDynamicTable({
      id,
      pageData: pageData,
      rowIndex: true,
      colDefine: this.createTableColumnsJson(id),
      content: this.pccProblemHandlingService.content,
    });
  }
  createTableColumnsJson(id: string) {
    return [
      {
        name: this.translateService.instant('dj-pcc-执行日期'),
        width: 120,
        schema: 'execute_datetime',
        dataType: 'string',
        type: 'DATEPICKER',
        editable: false,
        path: id,
        filterable: false,
        sortable: false,
        disabled: true,
      },
      {
        name: this.translateService.instant('dj-pcc-执行人员'),
        width: 150,
        schema: 'execute_person_name',
        dataType: 'string',
        type: 'INPUT',
        editable: false,
        path: id,
        filterable: false,
        sortable: false,
      },

      {
        name: this.translateService.instant('dj-pcc-执行方式'),
        width: 120,
        schema: 'execute_mode',
        dataType: 'string',
        editable: false,
        path: id,
        filterable: false,
        sortable: false,
        type: 'SELECT',
        options: [
          {
            title: this.translateService.instant('dj-pcc-创建'),
            value: ProblemExecutionMethod.CREATE,
          },
          {
            title: this.translateService.instant('dj-pcc-指派'),
            value: ProblemExecutionMethod.ASSIGN,
          },
          {
            title: this.translateService.instant('dj-pcc-处理'),
            value: ProblemExecutionMethod.HANDLE,
          },
          {
            title: this.translateService.instant('dj-pcc-转派'),
            value: ProblemExecutionMethod.TRANSFER,
          },
          {
            title: this.translateService.instant('dj-pcc-退回'),
            value: ProblemExecutionMethod.REGRESSION,
          },
          {
            title: this.translateService.instant('dj-pcc-验收通过'),
            value: ProblemExecutionMethod.PASS,
          },
          {
            title: this.translateService.instant('dj-pcc-验收不通过'),
            value: ProblemExecutionMethod.NO_PASS,
          },
        ],
      },
      {
        name: this.translateService.instant('dj-pcc-执行说明'),
        width: 200,
        schema: 'execute_reason',
        dataType: 'string',
        type: 'TEXTAREA',
        editable: false,
        path: id,
        filterable: false,
        sortable: false,
      },
    ];
  }
}
