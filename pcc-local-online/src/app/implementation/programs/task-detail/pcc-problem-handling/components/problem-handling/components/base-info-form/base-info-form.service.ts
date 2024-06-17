import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BaseDynamicCompBuilder } from 'app/implementation/class/DynamicCom';
import { ProblemHandlingService } from '../../problem-handling.service';
import { DynamicFormService, isEmpty } from '@athena/dynamic-core';
import { PccProblemHandlingService } from '../../../../pcc-problem-handling.service';
import { CreateDynamicFormCopService } from 'app/implementation/service/create-dynamic-form-cop.setvice';
import { CommonService } from 'app/implementation/service/common.service';
import { CreateDynamicCopRulesService } from 'app/implementation/service/create-dynamic-cop-rules.service';
import { CreateDynamicTableCopService } from 'app/implementation/service/create-dynamic-table-cop.setvice';
import { QuestPageDataStatus } from '../../../../config';

@Injectable()
export class BaseInfoFormService extends BaseDynamicCompBuilder {
  // 记录机制的content参数
  content: any;
  constructor(
    public commonService: CommonService,
    private translateService: TranslateService,
    public createDynamicFormCopService: CreateDynamicFormCopService,
    public problemHandlingService: ProblemHandlingService,
    public createDynamicCopRulesService: CreateDynamicCopRulesService,
    public formService: DynamicFormService,
    public createDynamicTableCopService: CreateDynamicTableCopService,
    private pccProblemHandlingService: PccProblemHandlingService
  ) {
    super(formService, createDynamicFormCopService, createDynamicTableCopService);
  }
  generateDynamicCop(pageData = {}, editable = true) {
    const id = 'issueBaseInfoForm';
    return this.initDynamicForm({
      id,
      colDefine: this.createFormListColumnsJson(id, pageData),
      content: this.pccProblemHandlingService.content,
      pageData: pageData,
    });
  }
  createFormListColumnsJson(id: string, pageData: any = {}) {
    return [
      {
        path: id,
        schema: 'project_no',
        name: this.translateService.instant('dj-pcc-项目编号'),
        description: this.translateService.instant('dj-pcc-项目编号'),
        dataType: 'string',
        type: 'INPUT',
        editable: false,
      },
      {
        path: id,
        schema: 'project_name',
        name: this.translateService.instant('dj-default-项目名称'),
        description: this.translateService.instant('dj-default-项目名称'),
        dataType: 'string',
        type: 'INPUT',
        editable: false,
      },
      {
        path: id,
        schema: 'task_name',
        name: this.translateService.instant('dj-pcc-任务'),
        description: this.translateService.instant('dj-pcc-任务'),
        dataType: 'string',
        type: 'INPUT',
        editable: false,
      },
      {
        path: id,
        schema: 'initiator_name',
        name: this.translateService.instant('dj-pcc-问题提出人'),
        description: this.translateService.instant('dj-pcc-问题提出人'),
        dataType: 'string',
        type: 'INPUT',
        editable: false,
      },
      {
        path: id,
        schema: 'question_happen_datetime',
        name: this.translateService.instant('dj-pcc-发生日期'),
        description: this.translateService.instant('dj-pcc-发生日期'),
        dataType: 'date',
        type: 'DATEPICKER',
        editable: false,
        disabled: true,
        isFocusDisplay: false,
      },
      {
        path: id,
        schema: 'question_type_name',
        name: this.translateService.instant('dj-pcc-问题类型'),
        description: this.translateService.instant('dj-pcc-问题类型'),
        dataType: 'string',
        // type: 'SELECT',
        type: 'INPUT',
        editable: false,
        disabled: true,
        // options: [
        //   {
        //     title: this.translateService.instant('dj-pcc-未发生'),
        //     value: '1',
        //   },
        //   {
        //     title: this.translateService.instant('dj-pcc-已发生'),
        //     value: '2',
        //   },
        // ],
      },
      {
        path: id,
        schema: 'process_person_name',
        name: this.translateService.instant('dj-pcc-问题负责人'),
        description: this.translateService.instant('dj-pcc-问题负责人'),
        dataType: 'string',
        type: 'INPUT',
        editable: false,
      },
      {
        path: id,
        schema: 'desire_finish_datetime',
        name: this.translateService.instant('dj-pcc-期望关闭日期'),
        description: this.translateService.instant('dj-pcc-期望关闭日期'),
        dataType: 'date',
        type: 'DATEPICKER',
        editable: false,
        disabled: true,
        isFocusDisplay: false,
      },
      {
        path: id,
        schema: 'actual_finish_datetime',
        name: this.translateService.instant('dj-pcc-实际关闭日期'),
        description: this.translateService.instant('dj-pcc-实际关闭日期'),
        dataType: 'date',
        type: 'DATEPICKER',
        editable: false,
        disabled: true,
        isFocusDisplay: false,
        hidden: pageData.status !== QuestPageDataStatus.DONE,
      },
      {
        path: id,
        schema: 'question_description',
        name: this.translateService.instant('dj-pcc-问题描述'),
        description: this.translateService.instant('dj-pcc-问题描述'),
        dataType: 'string',
        type: 'TEXTAREA',
        editable: false,
        precision: 500,
      },
    ];
  }
}
