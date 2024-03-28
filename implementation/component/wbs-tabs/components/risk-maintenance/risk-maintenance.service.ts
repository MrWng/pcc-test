import { ChangeDetectorRef, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { CommonService } from '../../../../service/common.service';
import { TranslateService } from '@ngx-translate/core';
import { CreateDynamicFormCopService } from 'app/implementation/service/create-dynamic-form-cop.setvice';
import { CreateDynamicTableCopService } from 'app/implementation/service/create-dynamic-table-cop.setvice';
import DataModel from './data-model';
import { DynamicWbsService } from '../../../wbs/wbs.service';
@Injectable()
export class PccRiskMaintenanceService {
  uibotUrl: string;

  // 记录机制的content参数
  content: any;

  constructor(
    private translateService: TranslateService,
    private http: HttpClient,
    protected changeRef: ChangeDetectorRef,
    private configService: DwSystemConfigService,
    private createDynamicFormCopService: CreateDynamicFormCopService,
    private createDynamicTableCopService: CreateDynamicTableCopService,
    public commonService: CommonService,
    public wbsService: DynamicWbsService
  ) {}
  getJSONTemplate(pageData = [], editable = true) {
    const data = {
      layout: [
        {
          id: 'riskMaintenance',
          type: 'ATHENA_TABLE',
          editable: editable,
          checkbox: editable,
          schema: 'riskMaintenance',
          allFields: this.createAllFields(pageData),
          setting: {
            hideDefaultToolbar: ['composite-sort', 'setting'],
          },
          operations: [
            {
              editable,
              title: this.translateService.instant('dj-default-新增'),
              type: 'pcc-risk-maintenance-table-add-project-detail',
              description: '新增',
              isCustomize: true,
            },
          ],
          columnDefs: this.createTableColumnsJson(editable),
        },
      ],
      pageData: {
        riskMaintenance: pageData || [],
      },
      rules: this.createTableRules(),
      style: {},
      content: this.content,
    };
    return data;
  }
  createTableColumnsJson(editable = true) {
    const executeContext = this.content.executeContext || {};
    let columnsDefs: Map<string, Object> | any[] = [
      {
        name: this.translateService.instant('dj-pcc-项目风险描述'),
        width: 150,
        schema: 'risk_description_name',
        dataType: 'string',
        type: 'INPUT',
        editable: false,
        path: 'riskMaintenance',
      },
      {
        name: this.translateService.instant('dj-pcc-风险类型'),
        width: 120,
        schema: 'risk_type_name',
        dataType: 'string',
        type: 'INPUT',
        editable: false,
        path: 'riskMaintenance',
      },
      {
        name: this.translateService.instant('dj-pcc-风险等级'),
        width: 120,
        schema: 'risk_level_name',
        dataType: 'string',
        type: 'INPUT',
        editable: false,
        path: 'riskMaintenance',
      },
      {
        name: this.translateService.instant('dj-pcc-关联WBS'),
        width: 120,
        schema: 'task_name',
        dataType: 'string',
        type: 'INPUT',
        editable: false,
        path: 'riskMaintenance',
      },
      {
        name: this.translateService.instant('dj-pcc-风险影响'),
        width: 120,
        schema: 'risk_effect_name',
        dataType: 'string',
        type: 'INPUT',
        editable: false,
        path: 'riskMaintenance',
      },
      {
        name: this.translateService.instant('dj-pcc-预防措施'),
        width: 200,
        schema: 'prevention_measure',
        dataType: 'string',
        type: 'TEXTAREA',
        editable: false,
        path: 'riskMaintenance',
      },
      {
        name: this.translateService.instant('dj-pcc-应对措施'),
        width: 200,
        schema: 'reply_measure',
        dataType: 'string',
        type: 'TEXTAREA',
        editable: false,
        path: 'riskMaintenance',
      },
      {
        name: this.translateService.instant('dj-pcc-风险状态'),
        width: 120,
        schema: 'risk_status',
        dataType: 'string',
        type: 'SELECT',
        editable: false,
        disabled: false,
        path: 'riskMaintenance',

        options: [
          {
            title: this.translateService.instant('dj-pcc-未发生'),
            value: '1',
          },
          {
            title: this.translateService.instant('dj-pcc-已发生'),
            value: '2',
          },
          {
            title: this.translateService.instant('dj-pcc-已失效'),
            value: '3',
          },
        ],
      },
      {
        name: this.translateService.instant('dj-pcc-发生日期'),
        width: 120,
        schema: 'happen_date',
        dataType: 'string',
        type: 'INPUT',
        path: 'riskMaintenance',

        editable: false,
      },
      {
        name: this.translateService.instant('dj-pcc-失效日期'),
        width: 120,
        schema: 'expiration_date',
        dataType: 'string',
        type: 'INPUT',
        editable: false,
        path: 'riskMaintenance',
      },
      {
        name: this.translateService.instant('dj-pcc-通知方式'),
        width: 120,
        schema: 'notice_mode',
        dataType: 'string',
        type: 'SELECT',
        editable: false,
        disabled: true,
        path: 'riskMaintenance',
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
        name: this.translateService.instant('dj-pcc-通知人员'),
        width: 180,
        schema: 'risk_notifier_info',
        path: 'riskMaintenance',
        dataType: 'object',
        type: 'FORM_OPERATION_EDITOR',
        editable: false,
        disabled: true,
        showInput: false,
        relationSchemas: ['employee_no', 'employee_name'],
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
              targetKey: 'employee_name',
              originKey: 'employee_name',
            },
            {
              targetKey: 'employee_no',
              originKey: 'employee_no',
            },
          ],
          dataKeys: [],
          actionAPI: 'bm.basc.app.auth.employee.get',
          title: this.translateService.instant('dj-pcc-通知人员'),
          multipleSelect: true,
          executeContext: executeContext,
          params: {
            sort_info: [
              {
                sort_field: 'department_no',
                sort_type: 'ASC',
                sort_seq: 1,
              },
            ],
          },
        },
      },
      {
        name: this.translateService.instant('dj-default-操作'),
        width: 120,
        schema: 'UIBOT_BUTTON_GROUP',
        dataType: 'string',
        type: 'pcc-risk-maintenance-table-operate-project-detail',
        editable: editable,
        pinned: 'right',
        path: 'riskMaintenance',
        isCustom: true,
      },
    ];
    columnsDefs = this.columnDefArrTransMap(columnsDefs) as Map<string, Object>;
    return this.createDynamicTableCopService.createDynamicCopJSON(Array.from(columnsDefs.values()));
  }
  createTableRules() {}
  createAllFields(pageData) {
    const rMt = new DataModel.RiskMaintenance(pageData[0] || {});
    const toString = Object.prototype.toString;
    const res = rMt.getKeys().map((key) => {
      const type = toString.call(rMt[key]);
      return {
        headerName: key,
        name: key,
        dataType: type
          .slice(1, type.length - 1)
          .split(' ')[1]
          .toLowerCase(),
        defaultValue: rMt[key],
      };
    });
    res.push({
      headerName: 'UIBOT_BUTTON_GROUP',
      name: 'UIBOT_BUTTON_GROUP',
      dataType: 'string',
      defaultValue: '',
    });
    return res;
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
  /**
   * 数据来源
   */
  BM_PISC_PROJECT_RISK_GET(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('bm.pisc.project.risk.get', {
          project_risk_info: params,
        })
        .subscribe(
          (res): void => {
            resolve(res.data.project_risk_info);
          },
          (e) => {
            reject(e);
          }
        );
    });
  }
  /**
   * 新增项目风险
   */
  BM_PISC_PROJECT_RISK_CREATE(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('bm.pisc.project.risk.create', {
          project_risk_info: params,
        })
        .subscribe(
          (res): void => {
            resolve(res.data.project_risk_info);
          },
          (e) => {
            reject(e);
          }
        );
    });
  }
  /**
   * 更新项目风险
   */
  BM_PISC_PROJECT_RISK_UPDATE(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('bm.pisc.project.risk.update', {
          project_risk_info: params,
        })
        .subscribe(
          (res): void => {
            resolve(res.data.project_risk_info);
          },
          (e) => {
            reject(e);
          }
        );
    });
  }
  /**
   * 删除项目风险
   */
  BM_PISC_PROJECT_RISK_DELETE(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('bm.pisc.project.risk.delete', {
          project_risk_info: params,
        })
        .subscribe(
          (res): void => {
            resolve(res.data.project_risk_info);
          },
          (e) => {
            reject(e);
          }
        );
    });
  }

  /** 回收任务卡 */
  recoveryCard(project_risk_seq) {
    return this.commonService
      .getServiceOrchestration(
        {
          type: 'invalid',
          projectArr: [
            {
              project_risk_seq,
              project_no: this.wbsService.riskMaintenanceProjectInfo.project_no,
            },
          ],
        },
        'pcc_closeProjectRisk'
      )
      .toPromise();
  }
}
