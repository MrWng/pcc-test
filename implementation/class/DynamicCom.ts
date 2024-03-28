import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  SkipSelf,
  ViewChild,
} from '@angular/core';
import {
  DwFormGroup,
  DynamicFormLayout,
  DynamicFormService,
  DynamicTableModel,
} from '@athena/dynamic-core';
import { CreateDynamicFormCopService } from '../service/create-dynamic-form-cop.setvice';
import { CreateDynamicTableCopService } from '../service/create-dynamic-table-cop.setvice';

export class BaseDynamicCompBuilder {
  public tableGroup: DwFormGroup;
  public tableLayout: DynamicFormLayout;
  public tableModel: DynamicTableModel[];
  public formGroup: DwFormGroup;
  public formLayout: DynamicFormLayout;
  public formModel: DynamicTableModel[];
  public uploadGroup: DwFormGroup;
  public uploadLayout: DynamicFormLayout;
  public uploadModel: DynamicTableModel[];
  options: any;
  formService: DynamicFormService;
  createDynamicFormCopService: CreateDynamicFormCopService;
  createDynamicTableCopService: CreateDynamicTableCopService;

  constructor(
    formService: DynamicFormService,
    createDynamicFormCopService: CreateDynamicFormCopService,
    createDynamicTableCopService: CreateDynamicTableCopService
  ) {
    this.formService = formService;
    this.createDynamicFormCopService = createDynamicFormCopService;
    this.createDynamicTableCopService = createDynamicTableCopService;
  }
  initDynamicForm(options) {
    this.options = options;
    this.initDynamicCop('form', options);
  }
  initDynamicTable(options) {
    this.options = options;
    this.initDynamicCop('table', options);
  }
  initDynamicUpload(options) {
    this.options = options;
    this.initDynamicCop('upload', options);
  }
  private initDynamicCop(type: string, options) {
    let source;
    switch (type) {
      case 'table':
        source = this.initTableJSON(options);
        break;
      case 'form':
        source = this.initFormJSON(options);
        break;
      case 'upload':
        source = this.initUploadJSON(options);
        break;
    }
    source.layout = Array.isArray(source?.layout) ? source.layout : [];
    source.content = source.content || {};
    const initializedData = this.formService.initData(
      source.layout as any,
      source.pageData,
      source.rules as any,
      source.style,
      source.content
    );
    this[type + 'Layout'] = initializedData.formLayout; // 样式
    this[type + 'Model'] = initializedData.formModel; // 组件数据模型
    this[type + 'Group'] = initializedData.formGroup; // formGroup
  }

  private initFormJSON(options) {
    const layout = [
      {
        id: options.id || 'dynamicCop',
        type: 'FORM_LIST',
        schema: options.id || 'dynamicCop',
        disabled: false,
        editable: options.editable,
        dataType: 'object',
        supportShowInMaxedWindow: true,
        important: false,
        isNavigate: false,
        group: this.createDynamicFormCopService.createDynamicCopJSON(options.colDefine),
        direction: options.direction || 'row',
      },
    ];
    return {
      layout,
      rules: options.rules || [],
      pageData: {
        issueBaseInfoForm: options.pageData || {},
      },
      style: {},
      content: options.content,
    };
  }
  private initTableJSON(options) {
    const layout = [
      {
        id: options.id || 'dynamicCop',
        type: 'ATHENA_TABLE',
        editable: options.editable,
        checkbox: options.checkbox,
        rowDelete: !!options.rowDelete,
        rowIndex: !!options.rowIndex,
        schema: options.id || 'dynamicCop',
        allFields: this.createTableFields(options.dataModel || options.colDefine),
        setting: {
          hideDefaultToolbar: ['composite-sort', 'setting'],
        },
        operations: options.operations || [],
        columnDefs: this.createDynamicTableCopService.createDynamicCopJSON(options.colDefine),
      },
    ];
    return {
      layout,
      rules: [],
      pageData: {
        issueBaseInfoForm: options.pageData || [],
      },
      style: {},
      content: options.content,
    };
  }
  private initUploadJSON(options) {
    const data = {
      layout: [
        {
          type: 'FORMGROUP',
          schema: options.id,
          editable: true,
          group: [
            {
              editable: true,
              disabled: false,
              schema: options.id,
              placeholder: '附件',
              type: 'PCC-ATTACHMENT',
              attribute: {
                uploadEnable: options.isEdit,
                editable: options.isEdit,
                uploadCategory: options.taskId,
                deleteCategory: [options.taskId],
                fileCount: 10,
                operations: [
                  {
                    actionParas: [
                      {
                        type: 'VARIABLE',
                        value: 'id',
                        key: 'id',
                      },
                      {
                        type: 'VARIABLE',
                        value: 'name',
                        key: 'name',
                      },
                      {
                        type: 'VARIABLE',
                        value: 'rowDataKey',
                        key: 'rowDataKey',
                      },
                      {
                        type: 'VARIABLE',
                        value: 'category',
                        key: 'category',
                      },
                      {
                        type: 'VARIABLE',
                        value: 'categoryId',
                        key: 'categoryId',
                      },
                      {
                        type: 'VARIABLE',
                        value: 'size',
                        key: 'size',
                      },
                    ],
                    api: '/api/aam/v1/uploadAttachment',
                    paras: {
                      tenantId: options.tenantId,
                      projectId: 'task_Assignment',
                      taskId: options.tenantId,
                    },
                    type: 'upload',
                  },
                  {
                    actionParas: [
                      {
                        type: 'VARIABLE',
                        value: 'id',
                        key: 'id',
                      },
                      {
                        type: 'VARIABLE',
                        value: 'category',
                        key: 'category',
                      },
                      {
                        type: 'VARIABLE',
                        value: 'categoryId',
                        key: 'categoryId',
                      },
                    ],
                    api: '/api/aam/v1/deleteAttachment',
                    type: 'delete',
                  },
                ],
                fileMaxSize: 104857600,
                readEnable: true,
                readCategory: [options.taskId],
                id: '9d3a546f-cdf7-4396-a714-637ae2e7f936',
                deleteEnable: options.isEdit,
                type: options.type,
                downloadEnable: options.downloadEnable,
              },
              dataType: 'string',
              headerName: options.headerName,
              size: options.size || 'default',
              id: options.id,
            },
          ],
        },
      ],
      pageData: {
        [options.id]: {
          attachment: options.uploadData,
        },
      },
    };

    return data;
  }
  private createTableFields(colDef: any[]) {
    if (this.options?.dataModel) {
      const res = Object.keys(colDef).map((key) => {
        return {
          name: key,
          headerName: key,
        };
      });
      res.push({
        name: this.options.colDefine[this.options.colDefine.length - 1].schema,
        headerName: this.options.colDefine[this.options.colDefine.length - 1].name,
      });
      return res;
    }
    return colDef.map((col) => {
      return {
        headerName: col.name,
        name: col.schema,
        dataType: col.dataType,
      };
    });
  }
}
