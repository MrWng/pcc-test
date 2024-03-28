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
import { QuestionDoInfo, QuestionDoInfoModel } from './Model';

@Injectable()
export class HandlingMattersTableService extends BaseDynamicCompBuilder {
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
      colDefine: this.createTableColumnsJson(id, editable),
      content: this.pccProblemHandlingService.content,
      checkbox: editable,
      // rowDelete: true,
      rowIndex: true,
      dataModel: new QuestionDoInfoModel(),
    });
  }
  createTableColumnsJson(id: string, editable = true) {
    return [
      {
        name: this.translateService.instant('dj-pcc-处理事项'),
        width: 150,
        schema: 'question_do_desc',
        dataType: 'string',
        type: 'TEXTAREA',
        editable: false,
        path: id,
        filterable: false,
        sortable: false,
      },
      {
        name: this.translateService.instant('dj-pcc-处理人'),
        width: 120,
        schema: 'process_person_name',
        dataType: 'string',
        type: 'INPUT',
        editable: false,
        path: id,
        filterable: false,
        sortable: false,
      },
      {
        name: this.translateService.instant('dj-pcc-计划完成日期'),
        width: 120,
        schema: 'plan_finish_datetime',
        dataType: 'string',
        type: 'DATEPICKER',
        editable: false,
        path: id,
        filterable: false,
        sortable: false,
        disabled: true,
      },
      {
        name: this.translateService.instant('dj-pcc-处理状态'),
        width: 120,
        schema: 'process_status',
        dataType: 'string',
        type: 'pcc-problem-handling',
        editable: false,
        path: id,
        filterable: false,
        sortable: false,
        isCustom: true,
        useType: 'status',
      },
      {
        name: this.translateService.instant('dj-pcc-实际完成日期'),
        width: 120,
        schema: 'actual_finish_datetime',
        dataType: 'string',
        type: 'LABEL',
        editable: false,
        path: id,
        filterable: false,
        sortable: false,
        disabled: true,
      },
      {
        name: this.translateService.instant('dj-pcc-处理说明'),
        width: 200,
        schema: 'process_description',
        dataType: 'string',
        type: 'TEXTAREA',
        editable: false,
        path: id,
        filterable: false,
        sortable: false,
      },
      {
        name: this.translateService.instant('dj-pcc-附件'),
        width: 200,
        schema: 'attachment',
        dataType: 'string',
        // type: 'FILE_UPLOAD',
        type: 'pcc-problem-handling',
        isCustom: true,
        useType: 'attachment',
        editable: false,
        path: id,
        filterable: false,
        sortable: false,
      },
      {
        name: this.translateService.instant('dj-default-操作'),
        width: 105,
        schema: 'UIBOT_BUTTON_GROUP',
        dataType: 'string',
        type: 'pcc-problem-handling',
        pinned: 'right',
        path: id,
        isCustom: true,
        filterable: false,
        sortable: false,
        useType: 'operate',
        hidden: !editable,
      },
    ];
  }
}
