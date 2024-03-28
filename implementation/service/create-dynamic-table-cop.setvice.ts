import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { isEmpty, isNotEmpty, isObject } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { UUID } from 'angular2-uuid';
import { CommonService } from './common.service';

// eslint-disable-next-line no-shadow
enum DynamicCopType {
  OPERATION_EDITOR = 'OperationEditor', // 开窗
  FORM_OPERATION_EDITOR = 'FormOperationEditor', // 表单开窗
  INPUT = 'Input',
  SELECT = 'Select',
  TEXTAREA = 'Textarea',
  NAME_CODE_COMPONENT = 'NameCodeComponent', // 内含外显
  LABEL = 'Label',
  DATEPICKER = 'DatePicker', // 日期
  UIBOT_BUTTON_GROUP = 'UibotButtonGroup', // 操作
  CHECKBOX = 'Checkbox',
  PERCENT_INPUT = 'PercentInput',
  FILE_UPLOAD = 'FileUpload',
}
// eslint-disable-next-line no-shadow
enum UibotButtonGroupType {
  'delete-row' = 'ForegroundDeleteType', // 前端删除行
}

@Injectable({
  providedIn: 'root',
})
export class CreateDynamicTableCopService {
  setColumns = Object.create(null);
  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private translateService: TranslateService,
    private commonService: CommonService
  ) {}
  createDynamicCopJSON(group: any) {
    const res = [];
    group.forEach((options) => {
      if (options.hidden) {
        return;
      }
      let columnDefine = this.setColumns[options.schema];
      if (isEmpty(columnDefine)) {
        columnDefine = this._createDefaultColumnJSON(options);
        this.setColumns[options.schema] = columnDefine;
        const columns = columnDefine.columns;
        if (!!options.isCustom) {
          Object.assign(columnDefine, options);
          columns.push(this.createCustomType(options));
        } else {
          columns.push(this['create' + DynamicCopType[options.type] + 'Type'](options));
        }
        res.push(columnDefine);
      } else {
        if (!!options.isCustom) {
          columnDefine.columns.push(this.createCustomType(options));
        } else {
          columnDefine.columns.push(
            this['create' + DynamicCopType[options.type] + 'Type'](options)
          );
        }
      }
    });
    // 处理完之后重置
    this.setColumns = Object.create(null);
    return res;
  }
  // 创建附件类型
  createFileUploadType(options: any) {
    const defaultConfig = this._createCommonOptions(options);
    return {
      ...defaultConfig,
      type: 'FILE_UPLOAD',
      attribute: {
        disableAam: options.disableAam || false,
        uploadEnable: isEmpty(options.editable) ? options.uploadEnable || true : options.editable,
        editable: options.editable || true,
        uploadCategory: options.uploadCategory || 'pccUploadAttachment',
        deleteCategory: [options.uploadCategory || 'pccUploadAttachment'],
        fileCount: options.fileCount || 3,
        enableEffectAfterSubmit: false,
        operations: [],
        deleteEnable: options.editable || false,
        fileExtensions: options.fileExtensions,
        fileMaxSize: options.fileMaxSize
          ? options.fileMaxSize * Math.pow(1024, 2)
          : 50 * Math.pow(1024, 2),
        readEnable: true,
        readCategory: [options.uploadCategory || 'pccUploadAttachment'],
        id: UUID.UUID(),
        filterKey: 'name',
      },
    };
  }
  // 创建自定义类型
  createCustomType(options: any) {
    return {
      ...this._createCommonOptions(options),
      ...options,
      isCustomize: true,
    };
  }
  // 创建百分比
  createPercentInputType(options: any) {
    const defaultConfig = this._createCommonOptions(options);
    delete defaultConfig.disabled;
    if (isNotEmpty(options.thousandthPercentile)) {
      defaultConfig['thousandthPercentile'] = true;
    }
    const res = {
      ...defaultConfig,
      type: 'LABEL',
      important: false,
      isNavigate: false,
    };
    if (res.editable || !res.disabled) {
      res['editor'] = {
        ...defaultConfig,
        type: 'PERCENT_INPUT',
        important: false,
        isNavigate: false,
      };
      if (options.dataPrecision) {
        res['editor']['dataPrecision'] = options.dataPrecision;
      }
    }
    return res;
  }
  // 创建复选框类型
  createCheckboxType(options: any) {
    const defaultConfig = this._createCommonOptions(options);
    delete defaultConfig.editable;
    return {
      ...defaultConfig,
      type: 'CHECKBOX',
      important: false,
      isNavigate: false,
    };
  }
  // 创建文本类型
  createInputType(options: any) {
    const defaultConfig = this._createCommonOptions(options);
    delete defaultConfig.disabled;
    if (options.dataType === 'numeric' && isNotEmpty(options.thousandthPercentile)) {
      defaultConfig['thousandthPercentile'] = true;
    }
    const res = {
      ...defaultConfig,
      type: 'INPUT',
      rowGroupable: true,
      enableTrim: true,
      important: false,
      isNavigate: false,
    };

    if (res.editable || !res.disabled) {
      res['editor'] = {
        ...defaultConfig,
        type: 'INPUT',
        important: false,
        isNavigate: false,
      };
    }
    return res;
  }

  // 创建操作栏
  createUibotButtonGroupType(options: any) {
    return {
      type: 'UIBOT_BUTTON_GROUP',
      schema: 'UIBOT_BUTTON_GROUP',
      headerName: options.name,
      important: false,
      isNavigate: false,
    };
  }
  // 创建文本域
  createTextareaType(options: any) {
    const commonOptions = this._createCommonOptions(options);
    delete commonOptions.disabled;
    return {
      ...commonOptions,
      type: 'TEXTAREA',
      level: 1,
      dataPrecision: {
        length: isEmpty(options.precision) ? 300 : options.precision,
      },
      rowGroupable: true,
      width: isEmpty(options.width) ? 230 : options.width,
      important: false,
      isNavigate: false,
    };
  }
  // 创建日期类型
  createDatePickerType(options: any) {
    const commonOptions = this._createCommonOptions(options);
    delete commonOptions.editable;
    const res = {
      ...commonOptions,
      type: 'DATEPICKER',
      showIcon: isEmpty(options.showIcon) ? true : !!options.showIcon,
      level: 1,
      rowGroupable: true,
      width: isEmpty(options.width) ? 150 : options.width,
      important: false,
      isNavigate: false,
    };
    if (res.editable || !res.disabled) {
      res['editor'] = {
        ...commonOptions,
        type: 'DATEPICKER',
        important: false,
        isNavigate: false,
      };
    }
    return res;
  }
  // 创建内含外显类型
  createNameCodeComponentType(options: any) {
    const res = {
      ...this._createCommonOptions(options),
      type: options.type,
      level: 1,
      width: 0,
      important: false,
      isNavigate: false,
      columns: [
        this.createLabelType({
          schema: options.schema,
          name: options.name,
          path: options.path,
          dataType: options.dataType,
          sortable: isEmpty(options.sortable) ? true : !!options.sortable,
          filterable: isEmpty(options.filterable) ? true : !!options.filterable,
        }),
        this.createLabelType({
          schema: options.inSchema,
          name: options.inName,
          path: options.path,
          dataType: options.inDataType,
          sortable: isEmpty(options.inSortable) ? true : !!options.inSortable,
          filterable: isEmpty(options.inFilterable) ? true : !!options.inFilterable,
        }),
      ],
    };
    return res;
  }
  // 创建lable类型
  createLabelType(options: any) {
    return {
      ...this._createCommonOptions(options),
      type: 'LABEL',
      level: 1,
      rowGroupable: true,
      important: false,
      isNavigate: false,
    };
  }

  // 创建下拉类型
  createSelectType(options: any) {
    const commonOptions = this._createCommonOptions(options);
    // delete commonOptions.disabled;
    const res = {
      ...commonOptions,
      type: 'SELECT',
      level: 1,
      width: isEmpty(options.width) ? 120 : options.width,
      important: false,
      isNavigate: false,
      options: options.options.map((item) => ({
        title: item.title,
        value: item.value,
      })),
    };
    if (res.editable || !res.disabled) {
      res['editor'] = {
        ...commonOptions,
        type: 'SELECT',
        width: isEmpty(options.width) ? 120 : options.width,
        important: false,
        options: options.options.map((item) => ({
          title: item.title,
          value: item.value,
        })),
        isNavigate: false,
      };
    }

    return res;
  }
  creteInputType(options: any) {
    return {
      ...this._createCommonOptions(options),
      type: 'INPUT',
      rowGroupable: true,
      enableTrim: true,
      isFocusDisplay: false,
      important: false,
      isNavigate: false,
    };
  }

  /**
   * 创建表单开窗json
   */
  createFormOperationEditorType(options: any) {
    const openWindowOptions = options.openWindowOptions;
    const res = {
      ...this._createCommonOptions(options),
      type: 'FORM_OPERATION_EDITOR',
      rowGroupable: true,
      canDelete: isEmpty(options.canDelete) ? true : !!options.showInput,
      operations: this.createOpenDefine({
        target: options.path,
        applyToField: options.schema,
        openWindowOptions: openWindowOptions,
      }),
      isFocusDisplay: false,
      important: false,
      isNavigate: false,
      showInput: isEmpty(options.showInput) ? true : !!options.showInput,
    };
    if (isNotEmpty(options.relationSchemas)) {
      res['relationSchemas'] = options.relationSchemas;
    }
    if (isNotEmpty(options.fields)) {
      res['fields'] = options.fields;
    }
    return res;
  }
  /**
   * 创建开窗json
   *
   */
  createOperationEditorType(options: any) {
    const openWindowOptions = options.openWindowOptions;
    const res = {
      ...this._createCommonOptions(options),
      type: 'OPERATION_EDITOR',
      rowGroupable: true,
      canDelete: isEmpty(options.canDelete) ? true : !!options.showInput,
      operations: this.createOpenDefine({
        target: options.path,
        applyToField: options.schema,
        openWindowOptions: openWindowOptions,
      }),
      isFocusDisplay: false,
      // relationSchemas: openWindowOptions.backFills.map((item) => item.targetKey),
      important: false,
      isNavigate: false,
      showInput: isEmpty(options.showInput) ? true : !!options.showInput,
    };
    if (isNotEmpty(options.relationSchemas)) {
      res['relationSchemas'] = options.relationSchemas;
    }
    if (isNotEmpty(options.fields)) {
      res['fields'] = options.fields;
    }
    if (res.editable || !res.disabled) {
      res['editor'] = {
        ...this._createCommonOptions(options),
        type: 'INPUT',
        rowGroupable: true,
        important: false,
        isNavigate: false,
        showInput: isEmpty(options.showInput) ? true : !!options.showInput,
      };
    }
    return res;
  }
  createOpenDefine(options: any) {
    let result = [];
    function _createResult({
      target,
      applyToField,
      multipleSelect,
      backFills,
      dataKeys,
      actionParams,
      actionAPI,
      title,
      executeContext,
      condition,
      params,
      useHasNext,
      dataSourceSet,
      enableAdvancedSearch,
      roleAttention,
    }) {
      const res = {
        title,
        description: title,
        operate: 'openwindow',
        attach: {
          target,
          applyToField,
          mode: 'row',
        },
        openWindowDefine: {
          title,
          getDataActions: [],
          enableAdvancedSearch: isEmpty(enableAdvancedSearch) ? true : enableAdvancedSearch,
          useHasNext: isEmpty(useHasNext) ? false : useHasNext,
          hashnext: isEmpty(useHasNext) ? false : useHasNext,
          allAction: {
            title: '推荐',
            defaultShow: false,
            executeContext: executeContext,
            dataSourceSet: dataSourceSet
              ? dataSourceSet
              : {
                  dataSourceList: [
                    {
                      name: 'allActionName',
                      dataKeys: dataKeys,
                      type: 'ESP',
                      actionId: `esp_${actionAPI}`,
                      action: {
                        title: '推荐',
                        actionId: `esp_${actionAPI}`,
                        category: 'ESP',
                        serviceId: {
                          tenant_id: executeContext.tenantId,
                          hostAcct: 'athena',
                          name: actionAPI,
                        },
                        paras: params,
                        actionParams: actionParams,
                      },
                      override: false,
                    },
                  ],
                  mainDatasource: 'allActionName',
                },
            relationTag: executeContext.relationTag,
            canEdit: false,
          },
          selectedFirstRow: false,
          multipleSelect: isEmpty(multipleSelect) ? false : !!multipleSelect,
          buttons: [
            {
              id: 'confirm',
              title: '提交',
              actions: [
                {
                  category: 'UI',
                  serviceId: {
                    tenant_id: executeContext.tenantId,
                    hostAcct: 'athena',
                  },
                  trackCode: 'SUBMIT',
                  backFills: backFills.map((item) => ({
                    valueScript: `selectedObject['${item.originKey}']`,
                    key: item.targetKey,
                  })),
                  defaultAction: false,
                  attachActions: [],
                },
              ],
            },
          ],
          submitActions: [],
          supportBatch: false,
          parameterType: 'ACTIVE_PARENT_ROW',
        },
        pageCode: executeContext.pageCode,
      };
      if (isNotEmpty(roleAttention)) {
        res.openWindowDefine['roleAttention'] = roleAttention;
      }
      if (isNotEmpty(condition)) {
        res['openWindowConditional'] = condition;
      }
      return res;
    }

    if (Array.isArray(options.openWindowOptions)) {
      result = options.openWindowOptions.map((item) =>
        _createResult({
          target: options.target,
          applyToField: options.applyToField,
          ...item,
        })
      );
    } else {
      result.push(
        _createResult({
          target: options.target,
          applyToField: options.applyToField,
          ...options.openWindowOptions,
        })
      );
    }

    return result;
  }
  /********************/
  // 操作 - 创建前端删除按钮
  private _createForegroundDeleteType(options: any) {
    return {
      title: this.translateService.instant('dj-default-删除'),
      type: 'delete-row',
      description: this.translateService.instant('dj-default-删除'),
      operate: 'delete-row',
      operateTarget: 'all-row',
      attach: {
        target: options.targetSchema,
        mode: 'row',
        applyToField: 'UIBOT_BUTTON_GROUP',
      },
      position: isEmpty(options.position) ? 'left' : options.position,
      icon: 'remove',
      pageCode: 'edit-page',
    };
  }
  // 创建通用表格列json
  private _createDefaultColumnJSON(options) {
    const res = {
      headerName: options.name,
      path: options.path,
      level: 1,
      description: options.description || '',
      operations: options.operations || [],
      width: isEmpty(options.width) ? 120 : options.width,
      hide: false,
      important: false,
      isNavigate: false,
      columns: [],
      headers: [],
      isUserDefined: true,
      sortable: isEmpty(options.sortable) ? true : !!options.sortable,
      filterable: isEmpty(options.filterable) ? true : !!options.filterable,
      disabled: !!options.disabled,
      editable: isEmpty(options.editable) ? true : !!options.editable,
    };
    // 操作栏位使用
    if (DynamicCopType[options.type] === 'UibotButtonGroup') {
      if (isNotEmpty(options.operations)) {
        res.operations = options.operations.map((operation) => {
          if (operation.isCustom) {
            const { operation: _op, ...rest } = options;
            return this.createCustomType(Object.assign(options, rest));
          }
          return this['_create' + UibotButtonGroupType[operation.type]](operation);
        });
      }
      res.width = isEmpty(options.width) ? 76 : options.width;
      res['pinned'] = isEmpty(options.pinned) ? 'right' : options.pinned;
    }
    return res;
  }
  // 创建公共列单元格选项
  private _createCommonOptions(options: any) {
    const res = {
      id: options.schema,
      schema: options.schema,
      headerName: options.name,
      path: options.path,
      description: options.description || '',
      disabled: !!options.disabled,
      editable: isEmpty(options.editable) ? true : !!options.editable,
      dataType: options.dataType,
      sortable: isEmpty(options.sortable) ? true : !!options.sortable,
      filterable: isEmpty(options.filterable) ? true : !!options.filterable,
      subtitle: isEmpty(options.subtitle) ? true : !!options.subtitle,
    };
    if (isNotEmpty(options.pinned)) {
      res['pinned'] = options.pinned;
    }
    return res;
  }
}
