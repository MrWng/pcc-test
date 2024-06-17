import { Injectable } from '@angular/core';




@Injectable({
  providedIn: 'root'
})
export class MoreControlService {

  constructor() { }
}

export const CONTROL_ITEM_LIST1 = [
  'item_type',     /** 品号类别/群组 */
  'item_type_value',     /** 品号类别条件值 */
  'item_operator',     /** 料号运算符 */
  'item_condition_value',     /** 料号条件值 */
];

export const CONTROL_ITEM_LIST2 = [
  'doc_type_no', // 单别
  'doc_no', // 单号
  'type_condition_value', // 类型条件值
  'sub_type_condition_value', // 次类型条件值
  'outsourcing_condition_value', // 托外条件值
];

export const CONTROL_ITEM_LIST3 = [
  'doc_type_no', // 单别
  'doc_no', // 单号
];

export const CONTROL_ITEM_LIST4 = [
  'doc_type_info', // 单别条件值
  'item_type', // 品号类别/群组
  'item_type_value', // 品号类别条件值
  'item_operator', // 料号运算符
  'item_condition_value', // 料号条件值
  'seq', // 序号
  'doc_type_no', // 单别条件值
  'doc_no', // 需要单别及单号
  'type_condition_value', // 类型条件值
  'sub_type_condition_value', // 次类型条件值
  'outsourcing_condition_value', // 托外条件值
];

/**
 * 禁用部分栏位的任务类型
 */
export const TASK_CATEGORY_LIST1 = ['ODAR', 'REVIEW', 'PLM', 'MES', 'PLM_PROJECT', 'ASSC_ISA_ORDER', 'PCM', 'APC', 'APC_O'];

/**
 * 以下任务类型，【类型条件值】和【次类型条件值】可编辑
 */
export const TASK_CATEGORY_LIST2 = ['MO_H', 'MO', 'MOMA', 'PO', 'PO_KEY', 'PO_NOT_KEY', 'OD', 'MOOP',
  'EXPORT', 'SHIPMENT', 'PR', 'PRSUM', 'POSUM', 'POPUR'];
