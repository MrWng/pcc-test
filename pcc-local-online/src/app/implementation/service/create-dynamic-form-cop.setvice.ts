import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { isEmpty, isNotEmpty } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { CommonService } from './common.service';
import { UUID } from 'angular2-uuid';
// eslint-disable-next-line no-shadow
enum DynamicCopType {
  OPERATION_EDITOR = 'OperationEditor', // 开窗
  FORM_OPERATION_EDITOR = 'FormOperationEditor', // 表单开窗
  INPUT = 'Input',
  SELECT = 'Select',
  TEXTAREA = 'Textarea',
  DATEPICKER = 'Datepicker',
  FORM_UPLOAD = 'FileUpload',
}

@Injectable({
  providedIn: 'root',
})
export class CreateDynamicFormCopService {
  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private translateService: TranslateService,
    private commonService: CommonService
  ) {}

  createDynamicCopJSON(group: any[]) {
    const res = [];
    group.forEach((options: any) => {
      if (options.hidden) {
        return;
      }
      res.push(this['create' + DynamicCopType[options.type] + 'Type'](options));
    });
    return res;
  }
  // 创建附件类型
  createFileUploadType(options: any) {
    const defaultConfig = this._createCommonOptions(options);
    return {
      ...defaultConfig,
      type: 'FORM_UPLOAD',
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
  // 创建文本域
  createTextareaType(options: any) {
    return {
      ...this._createCommonOptions(options),
      type: 'TEXTAREA',
      dataPrecision: {
        length: isEmpty(options.precision) ? 300 : options.precision,
      },
      rowGroupable: true,
      width: isEmpty(options.precision) ? 230 : options.precision,
      isFocusDisplay: false,
      important: false,
      isNavigate: false,
      label: options.name,
    };
  }
  // 创建下拉
  createSelectType(options: any) {
    return {
      ...this._createCommonOptions(options),
      type: 'SELECT',
      isFocusDisplay: false,
      important: false,
      options: options.options.map((item) => ({
        title: item.title,
        value: item.value,
      })),
      isNavigate: false,
    };
  }

  // 创建日期类型
  createDatepickerType(options: any) {
    return {
      ...this._createCommonOptions(options),
      dataType: 'date',
      type: 'DATEPICKER',
      isFocusDisplay: false,
      important: false,
      isNavigate: false,
    };
  }

  // 创建输入框
  createInputType(options: any) {
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
  createFormOperationEditorType(options: any) {
    return this.createOperationEditorType(options, 'FORM_OPERATION_EDITOR');
  }
  // 创建开窗json
  createOperationEditorType(options: any, type = 'OPERATION_EDITOR') {
    const openWindowOptions = options.openWindowOptions;
    const res = {
      ...this._createCommonOptions(options),
      type: type,
      rowGroupable: true,
      operations: this.createOpenDefine({
        openWindowOptions,
        target: options.path,
        applyToField: options.schema,
      }),
      isFocusDisplay: false,
      relationSchemas: openWindowOptions.backFills.map((item) => item.targetKey),
      important: false,
      isNavigate: false,
      showInput: isEmpty(options.showInput) ? true : !!options.showInput,
    };
    if (isNotEmpty(options.relationSchemas)) {
      res['relationSchemas'] = options.relationSchemas;
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
          allAction: {
            title: '推荐',
            defaultShow: false,
            executeContext: executeContext,
            dataSourceSet: {
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
                    paras: params || {},
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
          // parameterType: 'ACTIVE_PARENT_ROW',
        },
        pageCode: executeContext.pageCode,
      };
      if (isNotEmpty(roleAttention)) {
        res.openWindowDefine['roleAttention'] = roleAttention;
      }
      if (isNotEmpty(condition)) {
        res['condition'] = condition;
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

  // 创建公共选项
  private _createCommonOptions(options: any) {
    return {
      id: options.schema,
      schema: options.schema,
      headerName: options.name,
      path: options.path,
      disabled: !!options.disabled,
      editable: isEmpty(options.editable) ? true : !!options.editable,
      dataType: options.dataType,
      sortable: isEmpty(options.sortable) ? true : !!options.sortable,
      filterable: isEmpty(options.filterable) ? true : !!options.filterable,
    };
  }
}
