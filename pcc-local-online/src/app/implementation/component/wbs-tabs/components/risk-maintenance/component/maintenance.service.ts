import { ChangeDetectorRef, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { CommonService } from '../../../../../service/common.service';
import { TranslateService } from '@ngx-translate/core';
import { CreateDynamicFormCopService } from 'app/implementation/service/create-dynamic-form-cop.setvice';
import DataModel from '../data-model';
import { CreateDynamicCopRulesService } from 'app/implementation/service/create-dynamic-cop-rules.service';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
@Injectable()
export class PccRiskDetailMaintenanceService {
  uibotUrl: string;

  // 记录机制的content参数
  content: any;

  constructor(
    private translateService: TranslateService,
    private http: HttpClient,
    protected changeRef: ChangeDetectorRef,
    private configService: DwSystemConfigService,
    private createDynamicFormCopService: CreateDynamicFormCopService,
    private createDynamicCopRulesService: CreateDynamicCopRulesService,
    public commonService: CommonService,
    public wbsService: DynamicWbsService
  ) {}
  getJSONTemplate(pageData = {}, editable = true) {
    const layout = [
      {
        id: 'riskDetailMaintenance',
        type: 'FORM_LIST',
        schema: 'riskDetailMaintenance',
        disabled: false,
        editable: editable,
        dataType: 'object',
        supportShowInMaxedWindow: true,
        important: false,
        isNavigate: false,
        group: this.createFormListColumnsJson(),
        // direction: 'COLUMN',
        allFields: this.createAllFields(pageData),
      },
    ];
    return {
      layout,
      rules: this.createFormListRules(),
      pageData: {
        riskDetailMaintenance: pageData || {},
      },
      style: {},
      content: this.content,
    };
  }
  createFormListColumnsJson() {
    const executeContext = this.content.executeContext || {};
    let columnsDefs: any = [
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_description_name',
        name: this.translateService.instant('dj-pcc-项目风险描述'),
        description: this.translateService.instant('dj-pcc-项目风险描述'),
        dataType: 'string',
        type: 'OPERATION_EDITOR',
        editable: true,
        showInput: false,
        openWindowOptions: {
          backFills: [
            {
              originKey: 'no',
              targetKey: 'risk_description_no',
            },
            {
              originKey: 'name',
              targetKey: 'risk_description_name',
            },
          ],
          roleAttention: ['no', 'name', 'remarks'],
          dataKeys: [],
          actionAPI: 'bm.pisc.risk.user.defined.get',
          title: this.translateService.instant('dj-pcc-项目风险描述'),
          executeContext: executeContext,
          params: {
            risk_user_defined_info: [
              {
                type: '1',
                manage_status: 'Y',
              },
            ],
          },
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_effect_name',
        name: this.translateService.instant('dj-pcc-风险影响'),
        description: this.translateService.instant('dj-pcc-风险影响'),
        dataType: 'string',
        type: 'OPERATION_EDITOR',
        editable: true,
        showInput: false,
        openWindowOptions: {
          backFills: [
            {
              originKey: 'no',
              targetKey: 'risk_effect_no',
            },
            {
              originKey: 'name',
              targetKey: 'risk_effect_name',
            },
          ],
          dataKeys: [],
          roleAttention: ['no', 'name', 'remarks'],
          actionAPI: 'bm.pisc.risk.user.defined.get',
          title: this.translateService.instant('dj-pcc-风险影响'),
          executeContext: executeContext,
          params: {
            risk_user_defined_info: [
              {
                type: '3',
                manage_status: 'Y',
              },
            ],
          },
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_type_name',
        name: this.translateService.instant('dj-pcc-风险类型'),
        description: this.translateService.instant('dj-pcc-风险类型'),
        dataType: 'string',
        type: 'OPERATION_EDITOR',
        editable: true,
        showInput: false,
        openWindowOptions: {
          backFills: [
            {
              originKey: 'no',
              targetKey: 'risk_type_no',
            },
            {
              originKey: 'name',
              targetKey: 'risk_type_name',
            },
          ],
          dataKeys: [],
          roleAttention: ['no', 'name', 'remarks'],
          actionAPI: 'bm.pisc.risk.user.defined.get',
          title: this.translateService.instant('dj-pcc-风险类型'),
          executeContext: executeContext,
          params: {
            risk_user_defined_info: [
              {
                type: '2',
                manage_status: 'Y',
              },
            ],
          },
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_status',
        name: this.translateService.instant('dj-pcc-风险状态'),
        description: this.translateService.instant('dj-pcc-风险状态'),
        dataType: 'string',
        type: 'SELECT',
        editable: true,
        disabled: false,
        options: [
          {
            title: this.translateService.instant('dj-pcc-未发生'),
            value: '1',
          },
          {
            title: this.translateService.instant('dj-pcc-已发生'),
            value: '2',
          },
        ],
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_level_name',
        name: this.translateService.instant('dj-pcc-风险等级'),
        description: this.translateService.instant('dj-pcc-风险等级'),
        dataType: 'string',
        type: 'OPERATION_EDITOR',
        editable: true,
        showInput: false,
        openWindowOptions: {
          backFills: [
            {
              originKey: 'no',
              targetKey: 'risk_level_no',
            },
            {
              originKey: 'name',
              targetKey: 'risk_level_name',
            },
          ],
          dataKeys: [],
          roleAttention: ['no', 'name', 'remarks'],
          actionAPI: 'bm.pisc.risk.user.defined.get',
          title: this.translateService.instant('dj-pcc-风险等级'),
          executeContext: executeContext,
          params: {
            risk_user_defined_info: [{ type: '4', manage_status: 'Y' }],
          },
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'happen_date',
        name: this.translateService.instant('dj-pcc-发生日期'),
        description: this.translateService.instant('dj-pcc-发生日期'),
        dataType: 'date',
        type: 'DATEPICKER',
        editable: true,
        disabled: false,
        isFocusDisplay: false,
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'task_name',
        name: this.translateService.instant('dj-pcc-关联WBS'),
        description: this.translateService.instant('dj-pcc-关联WBS'),
        dataType: 'string',
        type: 'OPERATION_EDITOR',
        editable: true,
        showInput: false,
        relationSchemas: ['task_no', 'task_name'],
        openWindowOptions: {
          backFills: [
            {
              originKey: 'task_no',
              targetKey: 'task_no',
            },
            {
              originKey: 'task_name',
              targetKey: 'task_name',
            },
          ],
          dataKeys: [],
          actionAPI: 'bm.pisc.task.get',
          title: this.translateService.instant('dj-pcc-关联WBS'),
          executeContext: executeContext,
          roleAttention: ['task_name', 'task_no', 'task_status'],
          params: {
            query_condition: 'M1',
            level_type: '1',
            task_info: [
              {
                task_property: '1',
                project_no: this.wbsService.riskMaintenanceProjectInfo.project_no,
              },
            ],
            search_info: [
              {
                order: 1,
                // logic: 'and',
                search_field: 'task_status',
                search_operator: 'exist',
                search_value: ['10', '20', '60'],
              },
            ],
            return_field_info: [
              {
                return_field_path: 'M1',
                return_field: 'task_name',
              },
              {
                return_field_path: 'M1',
                return_field: 'task_no',
              },
              {
                return_field_path: 'M1',
                return_field: 'task_status',
              },
            ],
          },
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'notice_mode',
        name: this.translateService.instant('dj-pcc-通知方式'),
        description: this.translateService.instant('dj-pcc-通知方式'),
        dataType: 'string',
        type: 'SELECT',
        editable: false,
        disabled: true,
        options: [
          {
            title: this.translateService.instant('dj-pcc-风险提醒'),
            value: '1',
          },
          {
            title: this.translateService.instant('dj-pcc-风险转待办'),
            value: '2',
          },
        ],
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_notifier_info',
        name: this.translateService.instant('dj-pcc-通知人员'),
        description: this.translateService.instant('dj-pcc-通知人员'),
        dataType: 'object',
        type: 'FORM_OPERATION_EDITOR',
        editable: true,
        showInput: false,
        fields: [
          {
            schema: 'employee_no',
            show: true,
          },
          {
            schema: 'employee_name',
            show: true,
          },
        ],
        openWindowOptions: {
          backFills: [
            {
              targetKey: 'employee_no',
              originKey: 'employee_no',
            },
            {
              targetKey: 'employee_name',
              originKey: 'employee_name',
            },
          ],
          roleAttention: ['employee_name', 'employee_no', 'department_name', 'department_no'],

          dataKeys: [],
          actionAPI: 'bm.basc.app.auth.employee.get',
          title: this.translateService.instant('dj-pcc-通知人员'),
          multipleSelect: true,
          executeContext: executeContext,
          params: {
            appid: 'PCC',
            sort_info: [
              {
                sort_field: 'department_no',
                sort_type: 'ASC',
                sort_seq: 1,
              },
              {
                sort_field: 'employee_no',
                sort_type: 'ASC',
                sort_seq: 2,
              },
            ],
          },
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'prevention_measure',
        name: this.translateService.instant('dj-pcc-预防措施'),
        description: this.translateService.instant('dj-pcc-预防措施'),
        dataType: 'string',
        type: 'TEXTAREA',
        editable: true,
        precision: 500,
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'reply_measure',
        name: this.translateService.instant('dj-pcc-应对措施'),
        description: this.translateService.instant('dj-pcc-应对措施'),
        dataType: 'string',
        type: 'TEXTAREA',
        editable: true,
        precision: 500,
      },
    ];
    columnsDefs = this.columnDefArrTransMap(columnsDefs) as Map<string, Object>;
    return this.createDynamicFormCopService.createDynamicCopJSON(Array.from(columnsDefs.values()));
  }
  createFormListRules() {
    return this.createDynamicCopRulesService.createDynamicCopRules([
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_description_name',
        type: 'required',
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_effect_name',
        type: 'required',
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_type_name',
        type: 'required',
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_status',
        type: 'required',
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_level_name',
        type: 'required',
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'task_name',
        type: 'required',
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_notifier_info',
        type: 'required',
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_notifier_info',
        type: 'custom',
        errorMessage: this.translateService.instant('dj-pcc-通知人员不可重复！'),
        handler: ({ currentControl }) => {
          const data = currentControl.getRawValue();
          const set: any = {};
          set.size = 0;
          data.forEach((item) => {
            if (!set.hasOwnProperty(item.employee_no)) {
              set[item.employee_no] = true;
              set.size++;
            }
          });
          if (data.length === set.size) {
            return false;
          }
          return true;
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'happen_date',
        linkageSchemas: ['risk_status'],
        type: 'required',
        handler: ({ currentControl }) => {
          return currentControl.parent.get('risk_status').value === '2';
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_status',
        targetSchema: 'notice_mode',
        type: 'custom',
        handler: ({ currentControl }) => {
          const group = currentControl.parent;
          switch (currentControl.value) {
            case '1':
              group.get('notice_mode').setValue('1');
              break;
            case '2':
              group.get('notice_mode').setValue('2');
              break;
            default:
              break;
          }
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_status',
        targetSchema: 'risk_handle_status',
        type: 'custom',
        handler: ({ currentControl }) => {
          const group = currentControl.parent;
          switch (currentControl.value) {
            case '1':
              group.get('risk_handle_status').setValue('1');
              break;
            case '2':
              group.get('risk_handle_status').setValue('2');
              break;
            default:
              break;
          }
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_status',
        type: 'defaultValue',
        defaultValue: ({ utils, currentControl }) => {
          if (utils.isEmpty(currentControl.value)) {
            return '1';
          }
          return currentControl.value;
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_handle_status',
        type: 'defaultValue',
        defaultValue: ({ utils, currentControl }) => {
          if (utils.isEmpty(currentControl.value)) {
            return '1';
          }
          return currentControl.value;
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'notice_mode',
        type: 'defaultValue',
        defaultValue: ({ utils, currentControl }) => {
          if (utils.isEmpty(currentControl.value)) {
            return '1';
          }
          return currentControl.value;
        },
      },
      {
        path: 'riskDetailMaintenance',
        schema: 'risk_status',
        targetSchema: 'happen_date',
        type: 'disabled',
        handler: ({ data, currentControl, utils }) => {
          if (data.risk_status === '1') {
            const happenDateCtr = currentControl.parent.get('happen_date');
            happenDateCtr.setValue(null);
            return true;
          }
        },
      },
    ]);
  }
  createAllFields(pageData) {
    const rMt = new DataModel.RiskMaintenance(pageData[0] || {});
    const toString = Object.prototype.toString;
    return rMt.getKeys().map((key) => {
      const type = toString.call(rMt[key]);
      return {
        headerName: key,
        name: key,
        path: 'riskDetailMaintenance',
        isShow: true,
        dataType: type
          .slice(1, type.length - 1)
          .split(' ')[1]
          .toLowerCase(),
        defaultValue: rMt[key],
      };
    });
  }
  private columnDefArrTransMap(columnDefs: any[]): Map<string, object> {
    const map = new Map<string, object>();
    columnDefs.forEach((col) => {
      let schema = col.schema;
      if (map.has(schema) && col.isCustom) {
        schema = col.schema + '+';
      }
      map.set(schema, col);
    });
    return map;
  }
}
