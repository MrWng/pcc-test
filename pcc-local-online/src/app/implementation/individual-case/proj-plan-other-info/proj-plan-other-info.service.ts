import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { CommonService } from '../../service/common.service';
import {
  getClueInformationGroupCop,
  getHeadGroupCop,
  getOpportunityInformationGroupCop,
} from './compParamsConfig';
import { isNotEmpty } from '@athena/dynamic-core';
type Parm = {
  type: string;
  schema: string;
  headerName: string;
  editable?: boolean;
  disabled?: boolean;
  dataType?: string;
  sortable?: boolean;
  filterable?: boolean;
  rowGroupable?: boolean;
  enableTrim?: boolean;
  isFocusDisplay?: boolean;
  important?: boolean;
  isNavigate?: boolean;
  inline?: boolean;
  options?: any[];
  dataPrecision?: any;
};

@Injectable()
export class ProjPlanOtherInfoService {
  atdmUrl: string;
  eocUrl: string;
  uibotUrl: string;
  smartDataUrl: string;
  content: any;
  executeContext: any;
  isLoadStatus: boolean = true;
  projectInfo: any = {};
  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private commonService: CommonService,
    private translateService: TranslateService
  ) {
    this.configService.get('atdmUrl').subscribe((url: string) => {
      this.atdmUrl = url;
    });
    this.configService.get('eocUrl').subscribe((url: string): void => {
      this.eocUrl = url;
    });
    this.configService.get('uibotUrl').subscribe((url: string): void => {
      this.uibotUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
  }
  /**
   * html 中文字翻译
   * @param val
   */
  translatePccWord(val: string): string {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
  translatedDefaultWord(val: string): string {
    return this.translateService.instant(`dj-default-${val}`);
  }
  getJSONTemplate(defaultData = {}, editable = true) {
    const layout = [
      {
        id: 'e0bddb87-8eba-4d9c-8537-473fe80e1f24',
        type: 'FORM_LIST',
        schema: 'business_info',
        disabled: false,
        editable: editable,
        dataType: 'object',
        supportShowInMaxedWindow: true,
        important: false,
        isNavigate: false,
        group: [
          this.createHeadGroup(editable),
          this.createClueInformationGroup(editable),
          this.createOpportunityInformationGroup(editable),
          this.CreateBnusinessOpportunity2POAfter(editable),
        ],
        direction: 'COLUMN',
        allFields: this._createAllFields(),
      },
    ];
    return {
      layout,
      rules: this._createRules(),
      pageData: {
        business_info: defaultData,
      },
      style: {},
      content: {},
    };
  }
  createHeadGroup(editable = true) {
    const group = [];
    getHeadGroupCop().forEach((parm: Parm) => {
      group.push(this.createUiComp(parm, editable));
    });

    return {
      group,
      id: '3f1b328b-7b09-4a1d-b76b-7abdffc9aa43',
      type: 'FORM_LIST',
      dataType: 'object',
      operations: [],
      important: false,
      isNavigate: false,
      collapse: true,
      scriptFilters: [],
    };
  }
  // 线索信息
  createClueInformationGroup(editable = true) {
    // const group = [];
    // getClueInformationGroupCop().forEach((parm: Parm) => {
    //   parm.editable = editable;
    //   parm.disabled = !editable;
    //   group.push(this.createUiComp(parm, editable));
    // });
    return {
      group: [
        {
          type: 'gaosiao-other-info',
          source: '1',
          canEdit: editable,
          subsidiaryParameters: {
            project_no: this.projectInfo.project_no,
          },
        },
      ],
      id: '3f1b328b-7b09-4a1d-b76b-7abdffc9aa43',
      type: 'FORM_LIST',
      dataType: 'object',
      operations: [],
      important: false,
      isNavigate: false,
      collapse: true,
      scriptFilters: [],
      title: this.translatePccWord('线索信息'),
    };
  }
  // 商机信息
  createOpportunityInformationGroup(editable = true) {
    // const group = [];
    // getOpportunityInformationGroupCop().forEach((parm: Parm) => {
    //   parm.editable = editable;
    //   parm.disabled = !editable;
    //   group.push(this.createUiComp(parm, editable));
    // });
    return {
      group: [
        {
          type: 'gaosiao-other-info',
          source: '2',
          canEdit: editable,
          subsidiaryParameters: {
            project_no: this.projectInfo.project_no,
          },
        },
      ],
      id: '3f1b328b-7b09-4a1d-b76b-7abdffc9aa43',
      type: 'FORM_LIST',
      dataType: 'object',
      operations: [],
      important: false,
      isNavigate: false,
      collapse: true,
      scriptFilters: [],
      title: this.translatePccWord('商机信息'),
    };
  }

  CreateBnusinessOpportunity2POAfter(editable = true) {
    return {
      group: [
        {
          type: 'gaosiao-other-info',
          source: '3',
          canEdit: editable,
          subsidiaryParameters: {
            project_no: this.projectInfo.project_no,
          },
        },
      ],
      id: '3f1b328b-7b09-4a1d-b76b-7abdffc9aa43',
      type: 'FORM_LIST',
      dataType: 'object',
      operations: [],
      important: false,
      isNavigate: false,
      collapse: true,
      scriptFilters: [],
      title: this.translatePccWord('商机转PO后'),
    };
  }

  // 创建组件类型
  createUiComp(parm: Parm, editable = true) {
    parm.editable = editable;
    parm.disabled = !editable;
    parm.headerName = this.translatePccWord(parm.headerName);
    let res;
    switch (parm.type) {
      case 'input':
        res = this._creatInputType(parm);
        break;
      case 'date':
        res = this._creatDateType(parm);
        break;
      case 'checkbox':
        res = this._createCheckboxType(parm);
        break;
      case 'textarea':
        res = this._createTextAreaType(parm);
        break;
      case 'percentInput':
        res = this._createPercentInputType(parm);
        break;
      case 'select':
        res = this._createSelectType(parm);
        break;
      default:
        break;
    }
    return res;
  }

  _createAllFields() {
    const res = [] as any[];
    getHeadGroupCop().forEach((item: Parm) => {
      res.push({
        name: item.schema,
        path: 'business_info',
        headerName: item.headerName,
        level: 0,
        defaultValue: '',
        sort: false,
        isDataKey: false,
        isShow: true,
      });
    });
  }
  // 创建规则
  _createRules() {
    return [];
  }
  // 创建数值类型Input和普通Input
  _creatInputType(parm: Parm) {
    const res = {
      id: parm.schema,
      type: 'INPUT',
      schema: parm.schema,
      headerName: parm.headerName,
      path: 'business_info',
      editable: parm.editable !== undefined ? parm.editable : true,
      dataType: parm.dataType || 'string',
      sortable: parm.sortable || true,
      filterable: parm.filterable || true,
      rowGroupable: parm.rowGroupable || true,
      enableTrim: parm.enableTrim || true,
      isFocusDisplay: parm.isFocusDisplay || false,
      important: parm.important || false,
      isNavigate: parm.isNavigate || false,
    };
    if (isNotEmpty(parm.dataPrecision)) {
      res['dataPrecision'] = parm.dataPrecision;
    }
    return res;
  }
  // 创建日期类型
  _creatDateType(parm: Parm) {
    return {
      id: parm.schema,
      type: 'DATEPICKER',
      schema: parm.schema,
      headerName: parm.headerName,
      path: 'business_info',
      disabled: parm.disabled || false,
      editable: parm.editable || true,
      dataType: parm.dataType || 'date',
      sortable: parm.sortable || true,
      filterable: parm.filterable || true,
      rowGroupable: parm.rowGroupable || true,
      isFocusDisplay: parm.isFocusDisplay || false,
      important: parm.important || false,
      isNavigate: parm.isNavigate || false,
      inline: parm.inline || false,
    };
  }
  // 创建checkbox
  _createCheckboxType(parm: Parm) {
    return {
      id: parm.schema,
      type: 'CHECKBOX',
      schema: parm.schema,
      headerName: parm.headerName,
      path: 'business_info',
      thousandthPercentile: true,
      disabled: parm.disabled || false,
      editable: parm.editable !== undefined ? parm.editable : !parm.disabled,
      dataType: 'boolean',
      sortable: parm.sortable || true,
      important: parm.important || false,
      isNavigate: parm.isNavigate || false,
    };
  }
  // 创建TEXTAREA类型
  _createTextAreaType(parm: Parm) {
    return {
      id: parm.schema,
      type: 'TEXTAREA',
      schema: parm.schema,
      headerName: parm.headerName,
      path: 'business_info',
      disabled: parm.disabled || false,
      editable: parm.editable !== undefined ? parm.editable : !parm.disabled,
      dataType: 'string',
      dataPrecision: { length: parm['length'] !== undefined ? parm['length'] : -1 },
      sortable: parm.sortable || true,
      important: parm.important || false,
      isNavigate: parm.isNavigate || false,
      filterable: parm.filterable || true,
      rowGroupable: parm.rowGroupable || true,
      isFocusDisplay: parm.isFocusDisplay || false,
      label: parm.headerName,
    };
  }
  // 创建PERCENT_INPUT(百分比)类型
  _createPercentInputType(parm: Parm) {
    return {
      id: parm.schema,
      type: 'PERCENT_INPUT',
      schema: parm.schema,
      headerName: parm.headerName,
      path: 'business_info',
      editable: parm.editable !== undefined ? parm.editable : true,
      dataType: 'numeric',
      sortable: parm.sortable || true,
      filterable: parm.filterable || true,
      rowGroupable: parm.rowGroupable || true,
      enableTrim: parm.enableTrim || true,
      isFocusDisplay: parm.isFocusDisplay || false,
      important: parm.important || false,
      isNavigate: parm.isNavigate || false,
    };
  }
  // 创建SELECT类型
  _createSelectType(parm: Parm) {
    parm.options?.forEach((item) => {
      item.title = this.translatePccWord(item.title);
    });
    return {
      id: parm.schema,
      type: 'SELECT',
      schema: parm.schema,
      headerName: parm.headerName,
      path: 'business_info',
      disabled: parm.disabled || false,
      editable: parm.editable || true,
      dataType: 'string',
      isFocusDisplay: false,
      important: false,
      options: parm.options || [],
    };
  }
  /**
   * 这是一个请求示例，可以自行修改或删除
   */
  demo_api_data_get(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('item.supply.demand.data.get', {
          query_condition: params,
        })
        .subscribe((res): void => {
          resolve(res.data.demand_data);
        });
    });
  }
  /**
   * 获取
   */

  async getOpportunity(params: any): Promise<any> {
    return await new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('uc.project.business.opportunity.new.info.get', {
          business_info: [params],
        })
        .subscribe(
          (res): void => {
            resolve(res.data.business_info);
          },
          (err) => {
            reject(err);
          }
        );
    });
  }
  /**
   * 保存
   */
  async updateOpportunity(params: any): Promise<any> {
    return await new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('uc.project.business.opportunity.new.info.update', {
          business_info: [params],
        })
        .subscribe(
          (res): void => {
            resolve(res.data.business_info);
          },
          (err) => {
            reject(err);
          }
        );
    });
  }

  /**
   * 删除
   */
  async deleteOpportunity(params: any): Promise<any> {
    return await new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('uc.project.business.opportunity.new.info.delete', {
          business_info: [params],
        })
        .subscribe(
          (res): void => {
            resolve(res.data.business_info);
          },
          (err) => {
            reject(err);
          }
        );
    });
  }
}
