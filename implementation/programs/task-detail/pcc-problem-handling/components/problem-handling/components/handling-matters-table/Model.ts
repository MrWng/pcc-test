import { UUID } from 'angular2-uuid';

export interface HandingMattersTable {
  question_list_info: QuestionListInfo[];
  [property: string]: any;
}

export interface QuestionListInfo {
  /**
   * 问题验收人名称
   */
  acceptance_person_name: string;
  /**
   * 问题验收人编号
   */
  acceptance_person_no: string;
  /**
   * 实际关闭日期
   */
  actual_finish_datetime: Date;
  /**
   * 附件
   */
  attachment: Attachment[];
  /**
   * 期望关闭日期
   */
  desire_finish_datetime: Date;
  /**
   * 前置执行说明
   */
  front_execute_illustrate: string;
  /**
   * 前置执行方式
   */
  front_execute_mode: string;
  /**
   * 问题提出人名称
   */
  initiator_name: string;
  /**
   * 问题提出人编号
   */
  initiator_no: string;
  /**
   * 问题负责人名称
   */
  process_person_name: string;
  /**
   * 问题负责人编号
   */
  process_person_no: string;
  /**
   * 项目名称
   */
  project_name: string;
  /**
   * 项目编号
   */
  project_no: string;
  /**
   * 问题描述
   */
  question_description: string;
  /**
   * 问题处理事项信息
   */
  question_do_info: QuestionDoInfo[];
  /**
   * 问题发生日期
   */
  question_happen_datetime: string;
  /**
   * 问题清单历程信息
   */
  question_list_process_info: QuestionListProcessInfo[];
  /**
   * 问题编号
   */
  question_no: string;
  /**
   * 问题来源场景
   */
  question_source_scene: QuestionSourceScene;
  /**
   * 问题类型编号
   */
  question_type_no: string;
  /**
   * 解决方案
   */
  solution: string;
  /**
   * 状态
   */
  status: Status;
  /**
   * 任务名称
   */
  task_name: string;
  /**
   * 任务编号
   */
  task_no: string;
  [property: string]: any;
}

export interface Attachment {
  data: Datum[];
  /**
   * 行数据
   */
  row_data: string;
  [property: string]: any;
}

export interface Datum {
  /**
   * 类别
   */
  category: string;
  /**
   * 类别主键
   */
  category_id: string;
  /**
   * 创建时间
   */
  create_date: Date;
  /**
   * 主键
   */
  id: string;
  /**
   * 名称
   */
  name: string;
  /**
   * 行数据
   */
  row_data: string;
  /**
   * 大小
   */
  size: string;
  /**
   * 上传用户编号
   */
  upload_user_id: string;
  /**
   * 上传用户名
   */
  upload_user_name: string;
  [property: string]: any;
}

export interface QuestionDoInfo {
  /**
   * 实际完成时间
   */
  actual_finish_datetime: Date;
  /**
   * 是否转为任务
   */
  is_conversion_task: boolean;
  /**
   * 计划完成日期
   */
  plan_finish_datetime: Date;
  /**
   * 处理说明
   */
  process_desc: string;
  /**
   * 处理人名称
   */
  process_person_name: string;
  /**
   * 处理人编号
   */
  process_person_no: string;
  /**
   * 处理状态
   */
  process_status: QuestionDoInfoProcessStatus;
  /**
   * 问题事项说明
   */
  question_do_desc: string;
  /**
   * 问题事项编号
   */
  question_do_no: string;
  /**
   * 序号
   */
  seq: number;
  /**
   * 附件
   */
  attachment: Attachment;
  [property: string]: any;
}

/**
 * 处理状态
 */
// eslint-disable-next-line no-shadow
export enum QuestionDoInfoProcessStatus {
  The4 = '4',
  The8 = '8',
}

export interface QuestionListProcessInfo {
  /**
   * 执行时间
   */
  execute_datetime: Date;
  /**
   * 执行方式
   */
  execute_mode: ExecuteMode;
  /**
   * 执行人员名称
   */
  execute_person_name: string;
  /**
   * 执行人员编号
   */
  execute_person_no: string;
  /**
   * 执行原因
   */
  execute_reason: string;
  /**
   * 过程状态
   */
  process_status: QuestionListProcessInfoProcessStatus;
  /**
   * 序号
   */
  seq: number;
  [property: string]: any;
}

/**
 * 执行方式
 */
// eslint-disable-next-line no-shadow
export enum ExecuteMode {
  The1 = '1',
  The2 = '2',
  The3 = '3',
  The4 = '4',
  The5 = '5',
  The6 = '6',
  The7 = '7',
}

/**
 * 过程状态
 */
// eslint-disable-next-line no-shadow
export enum QuestionListProcessInfoProcessStatus {
  The1 = '1',
  The10 = '10',
  The11 = '11',
  The12 = '12',
  The2 = '2',
  The3 = '3',
  The4 = '4',
  The5 = '5',
  The6 = '6',
  The7 = '7',
  The8 = '8',
  The9 = '9',
}

/**
 * 问题来源场景
 */
// eslint-disable-next-line no-shadow
export enum QuestionSourceScene {
  The1 = '1',
  The2 = '2',
  The3 = '3',
  The4 = '4',
  The5 = '5',
}

/**
 * 状态
 */
// eslint-disable-next-line no-shadow
export enum Status {
  The1 = '1',
  The2 = '2',
  The3 = '3',
  The4 = '4',
  The5 = '5',
  The6 = '6',
  The7 = '7',
  The99 = '99',
}

export class QuestionDoInfoModel {
  /**
   * 问题编号
   */
  question_no: string = '';
  /**
   * 实际完成时间
   */
  actual_finish_datetime: Date = null;
  /**
   * 是否转为任务
   */
  is_conversion_task: boolean = false;
  /**
   * 计划完成日期
   */
  plan_finish_datetime: Date = null;
  /**
   * 处理说明
   */
  process_desc: string = '';
  /**
   * 处理人名称
   */
  process_person_name: string = '';
  /**
   * 处理人编号
   */
  process_person_no: string = '';
  /**
   * 处理状态
   */
  process_status: QuestionDoInfoProcessStatus = undefined;
  /**
   * 问题事项说明
   */
  question_do_desc: string = '';
  /**
   * 问题事项编号
   */
  question_do_no: string = '';
  /**
   * 序号
   */
  seq: number = undefined;
  /**
   * 附件
   */
  attachment: Attachment | {} = {
    row_data: UUID.UUID(),
    data: [],
  };
}
