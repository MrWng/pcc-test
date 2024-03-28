import { Inject, Injectable } from '@angular/core';
import { CommonService } from '../../../service/common.service';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from '@athena/dynamic-core';
import { ReplaySubject } from 'rxjs';

@Injectable()
export class ManualWorkReportingService {

  group: any;
  personList: any = new ReplaySubject();

  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    protected translateService: TranslateService,
    protected commonService: CommonService
  ) { }

  setTemplateJson(responseData: Array<any>, executeContext: any): any {
    const columns: any[] = [
      {
        name: this.translateService.instant('dj-default-执行人名称'),
        schema: 'employee_name',
        editable: true,
        dataType: 'object',
        path: 'manualWorkReporting',
        options: [],
        hide: false
      },
      {
        name: this.translateService.instant('dj-default-工时'),
        schema: 'work_hours',
        editable: true,
        dataType: 'numeric',
        type: 'INPUT',
        path: 'manualWorkReporting',
        hide: false
      }];
    const columns2: any[] = [{
      name: this.translateService.instant('dj-default-执行人编号'),
      schema: 'employee_no',
      editable: false,
      dataType: 'string',
      path: 'manualWorkReporting',
      type: 'INPUT',
      hide: true
    },
    {
      name: this.translateService.instant('dj-default-部门名称'),
      schema: 'department_name',
      editable: false,
      dataType: 'string',
      path: 'manualWorkReporting',
      type: 'INPUT',
      hide: true
    },
    {
      name: this.translateService.instant('dj-default-部门编号'),
      schema: 'department_no',
      editable: false,
      dataType: 'string',
      path: 'manualWorkReporting',
      type: 'INPUT',
      hide: true
    },
    {
      name: this.translateService.instant('dj-default-用户编号'),
      schema: 'user_id',
      editable: false,
      dataType: 'string',
      path: 'manualWorkReporting',
      type: 'INPUT',
      hide: true
    }];
    const data = {
      layout: [{
        id: 'manualWorkReporting',
        type: 'ATHENA_TABLE',
        schema: 'manualWorkReporting',
        dataType: 'array',
        editable: true,
        checkbox: false,
        operations: [
        //   {
        //   title: this.translateService.instant('dj-default-新增'),
        //   type: 'add',
        //   description: '新增',
        //   attach: {
        //     target: 'manualWorkReporting',
        //     mode: 'all',
        //   },
        //   pageCode: 'basic-data', // 'task-detail',
        // }
        ],
        setting: {
          hideDefaultToolbar: ['setting', 'composite-sort']
        },
        rowDelete: true,
        columnDefs:
        [{
          headerName: this.translateService.instant('dj-default-执行人名称'),
          important: false,
          operations: [],
          // suppressFillHandle: true, // 该栏位不允许批量赋值
          columns: [{
            id: 'employee_name',
            type: 'OPERATION_EDITOR',
            headerName: this.translateService.instant('dj-default-执行人名称'),
            path: 'manualWorkReporting',
            schema: 'employee_name',
            placeholder: this.translateService.instant('dj-pcc-请输入'),
            editable: true,
            // dataType: 'object',
            dataType: 'string',
            sortable: true,
            filterable: true,
            rowGroupable: true,
            enableTrim: true,
            // 控制页面回显字段，和backFills效果一样
            fields:[{
              // 不隐藏的，即显示
              schema: 'employee_name',
              show: true
            // },{
            //   schema: 'employee_no',
            //   show: false
            }],
            operations: [{
              title: this.translateService.instant('dj-default-请选择执行人员'),
              description: this.translateService.instant('dj-default-请选择执行人员'),
              operate: 'openwindow',
              attach: {
                target: 'manualWorkReporting',
                mode: 'row',
                applyToField: 'employee_name',
              },
              openWindowDefine: {
                title: this.translateService.instant('dj-default-请选择执行人员'),
                getDataActions: [],
                allAction: {
                  executeContext,
                  title: this.translateService.instant('dj-default-推荐'),
                  defaultShow: false,
                  dataSourceSet: {
                    dataSourceList: [{
                      name :'allActionName',
                      // 返回对象时，使用的组合式主键
                      dataKeys:['employee_name', 'employee_no', 'department_no', 'role_no', 'user_id'],

                      type: 'ESP',
                      actionId: 'esp_employee.info.process',
                      action: {
                        title: this.translateService.instant('dj-default-请选择执行人员'),
                        actionId: 'esp_employee.info.process',
                        category: 'ESP',
                        serviceId: {
                          tenant_id: executeContext?.tenantId,
                          hostAcct: 'athena',
                          name: 'employee.info.process',
                        },
                        paras: { project_member_info: [{project_no: ''}] },
                        actionParams: [],
                        businessUnit: {
                          // eoc_company_id: executeContext?.businessUnit.eoc_company_id,
                        },
                      },
                      override: false,
                    }],
                    mainDatasource: 'allActionName',
                  },
                },
                selectedFirstRow: false,
                multipleSelect: false,
                buttons: [{
                  id: 'confirm',
                  title: this.translateService.instant('dj-default-提交'),
                  actions: [{
                    invokeType: '',
                    category: 'UI',
                    serviceId: {
                      tenant_id: executeContext?.tenantId,
                      hostAcct: 'athena',
                    },
                    businessUnit: executeContext?.businessUnit,
                    // 控制页面回显字段，和fields效果一样
                    backFills: [{
                    //   key: 'project_no',
                    //   valueScript: 'selectedObject["project_no"]',
                    // },{
                      key: 'department_name',
                      valueScript: 'selectedObject["department_name"]',
                    },{
                      key: 'department_no',
                      valueScript: 'selectedObject["department_no"]',
                    },{
                      key: 'employee_name',
                      valueScript: 'selectedObject["employee_name"]',
                    },{
                      key: 'employee_no',
                      valueScript: 'selectedObject["employee_no"]',
                    // },{
                    //   key: 'role_name',
                    //   valueScript: 'selectedObject["role_name"]',
                    // },{
                    //   key: 'role_no',
                    //   valueScript: 'selectedObject["role_no"]',
                    },{
                      key: 'user_id',
                      valueScript: 'selectedObject["user_id"]',
                    }],
                    defaultAction: false,
                    executeContext,
                    attachActions: [],
                  }],
                }],
                submitActions: [],
                roleAttention: ['employee_no', 'employee_name', 'department_name', 'department_no']
              },
              relationTag: executeContext?.relationTag,
              canEdit: false,
              pageCode: 'task-detail'
            }],
            // suppressFillHandle: true,
            // 置空，表示该栏位不允许批量赋值
            relationSchemas:[ ]
          }]
        },
        {
          headerName: this.translateService.instant('dj-default-工时'),
          schema: 'work_hours',
          path: 'manualWorkReporting',
          columns: [{
            type: 'INPUT',
            schema: 'work_hours',
            headerName: this.translateService.instant('dj-default-工时'),
            path: 'manualWorkReporting',
            level: 0,
            // min: 0,
            editable: true,
            thousandthPercentile: true,
            disabled: false,
            dataType: 'numeric',
            sortable: false,
            filterable: false,
            rowGroupable: false,
            width: 73,
            enableTrim: true,
            relationSchemas:['work_hours'],
            dataPrecision: {
              // 总长度
              // length: 5,
              // 小数位数
              place: 2,
            },
            editor: {
              id: new Date(),
              type: 'INPUT',
              schema: 'work_hours',
              showIcon: false,
              editable: true,
              dataType: 'numeric',
              inputType: 'number'
            }
          }]
        },...this.getColumnDefs(columns2)],
        // 数据源(AllFields)配置
        allFields: this.getAllFields(columns),
        suppressAutoAddRow: true,
        suppressFirstAddRow: true,
        // suppressFirstAddRow: false, // 自动添加新行
        saveColumnsWidth: true,
        details: [],
        pageDataKeys:{
          manualWorkReporting: [ 'employee_no', 'employee_name', 'work_hours' ]
        },
      }],
      pageData: {
        manualWorkReporting: responseData || [],
      },
      pageDataKeys:{
        manualWorkReporting:[ 'employee_no', 'employee_name' ]
      },
      content: {
        category: 'SIGN-DOCUMENT',
        executeContext: executeContext
      },
      rules: this.getRules(),
      style: {},
    };
    return data;
  }

  getColumnDefs(columns: any[]): any[] {
    if (!columns || !columns.length) {
      return [];
    }
    const columnList = cloneDeep(columns);
    const columnDefs = [];
    let column = {};
    columnList.forEach(item => {
      column = {
        headerName: item.name,
        schema: item.schema,
        path: item.path,
        hide: item.hide,
        columns: [{
          type: item.type,
          schema: item.schema,
          headerName: item.name,
          path: item.path,
          level: 0,
          editable: item.editable,
          dataType: item.dataType,
          sortable: false,
          filterable: false,
          rowGroupable: false,
          width: 73,
          important: false,
          isNavigate: false,
          editor: {
            id: new Date(),
            type: item.type,
            schema: item.schema,
            showIcon: false,
            editable: item.editable,
            dataType: item.dataType,
            important: false,
            isNavigate: false
          }
        }]
      };
      columnDefs.push(column);
    });
    return columnDefs;
  }

  getAllFields(columns: any[]): any[] {
    if (!columns || !columns.length) {
      return [];
    }
    const columnList = cloneDeep(columns);
    const columnDefs = [];
    columnList.forEach(item => {
      const column = {
        name: item.name,
        schema: item.schema,
        path: item.path,
        dataType: item.dataType,
        type: item.type,
        editable: item.editable
      };
      columnDefs.push(column);
    });
    return columnDefs;
  }

  getRules(): any[] {
    return [
      {
        schema:'employee_name',
        path:'manualWorkReporting',
        condition:'true',
        scope:'EDIT',
        errorMessage:this.translateService.instant('dj-pcc-执行人名称不可为空'),
        language:{
          errorMessage:{
            zh_TW:'執行人名稱不可為空',
            zh_CN:'执行人名称不可为空'
          }
        },
        lang:{
          errorMessage:{
            zh_TW:'執行人名稱不可為空',
            zh_CN:'执行人名称不可为空'
          }
        },
        key:'required'
      },
    ];
  }

}
