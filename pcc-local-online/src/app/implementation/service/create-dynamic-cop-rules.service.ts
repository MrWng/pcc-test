import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { isEmpty, isNotEmpty, isObject } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { UUID } from 'angular2-uuid';
import { CommonService } from './common.service';

const noon = function noon() {};
const arrowFnReg = /^\s*\(\s*({\s*[^}]*\s*})\s*\)\s*=>/;

// eslint-disable-next-line no-shadow
enum DynamicCopRulesType {
  repeat = 'Repeat',
  required = 'Required',
  defaultValue = 'DefaultValue',
  exist = 'Exist',
  setValueByAPI = 'SetValueByAPI',
  custom = 'Custom',
  disabled = 'Disabled',
  connection = 'Connection',
}
@Injectable({
  providedIn: 'root',
})
export class CreateDynamicCopRulesService {
  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private translateService: TranslateService,
    private commonService: CommonService
  ) {}
  createDynamicCopRules(options: any[]) {
    const result = [];
    options.forEach((op) => {
      result.push(this['create' + DynamicCopRulesType[op.type] + 'Rule'](op));
    });
    return result;
  }
  // 创建自定义规则
  createCustomRule({ errorMessage = '', path, schema, handler }) {
    let condition = '',
      handlerString = '';
    if (typeof handler === 'string') {
      condition = handler;
    } else if (typeof handler === 'function') {
      handlerString = handler.toString();
      condition = `(${handlerString})({data, currentControl, utils})`;
    }
    return {
      errorMessage,
      path,
      schema,
      condition,
      key: 'custom',
    };
  }

  // 创建联动规则
  createConnectionRule({ schema, path, handler, targetSchema }) {
    let handlerString = handler.toString();
    if (!handlerString.startsWith('function') && !arrowFnReg.test(handlerString)) {
      handlerString = 'function ' + handlerString;
    }
    return {
      path,
      schema,
      targetSchema,
      key: 'connection',
      condition: 'true',
      relations: [
        {
          path: targetSchema,
          operations: [
            {
              type: 'script',
              script: `
              (${handlerString})({currentControl, moment, utils})
              `,
            },
          ],
        },
      ],
    };
  }
  // 创建必填规则
  createRequiredRule({
    schema,
    path,
    handler,
    isAllData = false,
    linkageSchemas = [],
    errorMessage = this.translateService.instant('dj-不能为空'),
  }) {
    if (typeof handler === 'function') {
      let handlerString = handler.toString();
      handlerString =
        handlerString.startsWith('function') || arrowFnReg.test(handlerString)
          ? handlerString
          : 'function ' + handlerString;
      handler = `(${handlerString})({data: data, currentControl, utils})`;
    }
    if (isAllData) {
      return {
        errorMessage,
        schema,
        linkageSchemas,
        condition: handler ? handler : 'data.length === 0',
        validatorType: 'error',
        scope: 'EDIT',
        trigger: {
          type: 'sync',
          point: 'default',
        },
        key: 'custom',
      };
    }
    return {
      schema,
      path,
      linkageSchemas,
      errorMessage,
      condition: handler ? handler : 'true',
      key: 'required',
      scope: 'EDIT',
    };
  }
  // 创建重复规则
  createRepeatRule({
    schema,
    path,
    linkageSchemas = [],
    targetSchema,
    handler,
    errorMessage = this.translateService.instant('dj-pcc-数据重复'),
  }) {
    if (typeof handler === 'function') {
      let handlerString = handler.toString();
      handlerString =
        handlerString.startsWith('function') || arrowFnReg.test(handlerString)
          ? handlerString
          : 'function ' + handlerString;
      handler = `(${handlerString})({data: data, currentControl, utils})`;
    }
    return {
      linkageSchemas: linkageSchemas,
      path: path,
      schema: schema,
      key: 'repeat',
      condition: isNotEmpty(handler) ? handler : 'true',
      errorMessage: errorMessage,
      scope: 'EDIT',
    };
  }
  // 创建默认值规则
  createDefaultValueRule({ schema, path, defaultValue }) {
    let condition;
    if (typeof defaultValue === 'string') {
      condition = defaultValue;
    } else {
      let handlerString = defaultValue.toString();
      handlerString =
        handlerString.startsWith('function') || arrowFnReg.test(handlerString)
          ? handlerString
          : 'function ' + handlerString;
      condition = `(${handlerString})({data: data, currentControl, utils})`;
    }
    return {
      schema,
      path,
      targetSchema: schema,
      condition: 'true',
      validatorType: 'error',
      scope: 'EDIT',
      trigger: {
        condition,
        type: 'sync',
        point: 'default',
      },
      key: 'defaultValue',
    };
  }

  // 创建禁用规则
  createDisabledRule({ schema, path, targetSchema, handler = noon }) {
    let handlerString = handler.toString();
    handlerString =
      handlerString.startsWith('function') || arrowFnReg.test(handlerString)
        ? handlerString
        : 'function ' + handlerString;
    return {
      schema,
      path,
      targetSchema,
      condition: `(${handlerString})({data, currentControl, utils})`,
      validatorType: 'error',
      trigger: {
        type: 'sync',
        point: 'default',
      },
      key: 'disabled',
    };
  }
  // 创建是否存在规则
  createExistRule({
    schema,
    path,
    errorMessage = '不存在！',
    paramCallback,
    targetSchema,
    patchParams,
  }) {
    let paramCallBackString = paramCallback.toString();
    paramCallBackString =
      paramCallBackString.startsWith('function') || arrowFnReg.test(paramCallBackString)
        ? paramCallBackString
        : 'function ' + paramCallBackString;
    let condition;
    if (typeof targetSchema === 'function') {
      let targetSchemaCallBackString = targetSchema.toString();
      targetSchemaCallBackString =
        targetSchemaCallBackString.startsWith('function') ||
        arrowFnReg.test(targetSchemaCallBackString)
          ? targetSchemaCallBackString
          : 'function ' + targetSchemaCallBackString;
      condition = `(${targetSchemaCallBackString})({data: data, currentControl, utils})`;
    } else {
      condition = `!data.data?.[0]?.['${targetSchema || schema}']`;
    }
    const parameterScript = `
    function deepMerge(obj1, obj2) {
      let key;
      for (key in obj2) {
        obj1[key] = 
        obj1[key] && 
        obj1[key].toString() === '[object Object]' && 
        (obj2[key] && obj2[key].toString() === '[object Object]') ? deepMerge(obj1[key], obj2[key]) : (obj1[key] = obj2[key]);
      }
      return obj1;
    }
    const _f = ${paramCallBackString};
      const _params = (_f)({rowData, currentControl, moment, utils}) || {};
      const patchParams = 
      ${isEmpty(patchParams) ? "''" : JSON.stringify(patchParams)};
      if(!utils.isEmpty(patchParams) && !utils.isEmpty(_params)) {
        _params.paras = deepMerge(_params.paras, patchParams)
      }
      let canRequest=false;
      if(!utils.isEmpty(currentControl.value)){
        canRequest=true
      }
      const params={
        "canRequest":canRequest,
        businessUnit:businessUnit,
        tmAction:{
          "sequence":0,
          "type":"ESP",
          "actionId":"esp_" + _params.actionId
        },
        paras: _params.paras
      };return params;
      `;

    return {
      schema,
      path,
      targetSchema: schema,
      condition: '',
      validatorType: 'error',
      linkageSchemas: [],
      scope: 'EDIT',
      errorMessage: errorMessage,
      trigger: {
        parameterScript: parameterScript,
        condition: condition,
        needValidateParameter: true,
        apiUrl: '/api/atdm/v1/data/query/by/action',
        needCustomEvaluation: false,
        apiPrefixType: 'atdmUrl',
        type: 'async',
        point: 'dataChanged',
      },
      key: 'required',
    };
  }
  // 创建调接口赋值规则
  createSetValueByAPIRule({
    schema,
    path,
    targetSchema,
    paramCallback,
    evaluationCallback,
    patchParams,
  }) {
    let paramCallBackString = paramCallback.toString(),
      evaluationCallbackString = evaluationCallback.toString();
    if (!paramCallBackString.startsWith('function') && !arrowFnReg.test(paramCallBackString)) {
      paramCallBackString = 'function ' + paramCallBackString;
    }
    if (
      !evaluationCallbackString.startsWith('function') &&
      !arrowFnReg.test(evaluationCallbackString)
    ) {
      evaluationCallbackString = 'function ' + evaluationCallbackString;
    }
    const parameterScript = `
    function deepMerge(obj1, obj2) {
      let key;
      for (key in obj2) {
        obj1[key] = 
        obj1[key] && 
        obj1[key].toString() === '[object Object]' && 
        (obj2[key] && obj2[key].toString() === '[object Object]') ? deepMerge(obj1[key], obj2[key]) : (obj1[key] = obj2[key]);
      }
      return obj1;
    }
    const _f =  ${paramCallBackString};
      const _params = (_f)({rowData, currentControl, moment, utils}) || {};
      const patchParams = 
      ${isEmpty(patchParams) ? "''" : JSON.stringify(patchParams)};
      if(!utils.isEmpty(patchParams) && !utils.isEmpty(_params)) {
        _params.paras = deepMerge(_params.paras, patchParams)
      }
      let canRequest=false;
      if(!utils.isEmpty(currentControl.value)){
        canRequest=true
      }
      const params={
        "canRequest":canRequest,
        businessUnit:businessUnit,
        tmAction:{
          "sequence":0,
          "type":"ESP",
          "actionId":"esp_" + _params.actionId
        },
        paras: _params.paras
      };return params;
      `;

    return {
      schema,
      path,
      targetSchema,
      validatorType: 'error',
      scope: 'EDIT',
      asyncCacheScope: 'page',
      trigger: {
        parameterScript,
        condition: 'data',
        needValidateParameter: true,
        apiUrl: '/api/atdm/v1/data/query/by/action',
        needCustomEvaluation: true,
        apiPrefixType: 'atdmUrl',
        evaluationScript: `
        const _f =  ${evaluationCallbackString};
        const _params = (_f)({responseData: data.data, currentControl, moment, utils});
          `,
        type: 'async',
        point: 'dataChanged',
      },
      relations: [],
      key: 'value',
    };
  }
}
