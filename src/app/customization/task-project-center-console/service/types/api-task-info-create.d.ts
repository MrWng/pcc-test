export interface TaskMemberInfo {
  executor_role_name?: string;
  executor_role_no?: string;
  executor_department_name: string;
  /** 任务执行人部门编号 */
  executor_department_no: string;
  /**  */
  executor_name: string;
  /** 任务执行人编号 */
  executor_no: string;
  /** 项目编号 */
  project_no: string;
  /** 任务编号 */
  task_no: string;
}

export interface TaskDependencyInfo {
  /** 前置任务编号 */
  before_task_no: string;
  /** 依赖关系类型	FS:完成才开始;FF:完成才完成;SS:开始才开始 */
  dependency_type: string;
  /** 提前滞后类型	-1:提前;1:滞后 */
  advance_lag_type: number;
  /** 提前滞后天数 */
  advance_lag_days: number;
  /**  */
  default_before_task_no: string;
  /** 项目编号 */
  project_no: string;
  /** 任务编号 */
  after_task_no: string;
}

export interface DocTypeInfo {
  /** 单别条件值 */
  doc_condition_value: string;
}

export interface Attachment {
  data: any[];
  /** 行数据 */
  row_data: string;
}

export interface DocTypeInfo {
  /** 单别条件值 */
  doc_condition_value: string
}

export interface TaskInfoCreateParams {
  /** 任务名称 */
  task_name: string;
  /** 上阶任务编号 */
  upper_level_task_no?: any;
  /** 是否依设备清单展开 true：是 false：否 */
  is_equipment_list_unfold?: boolean;
  /** 是否里程碑	true：是 false：否 */
  is_milepost: boolean;
  /** 里程碑说明 */
  milepost_desc: string;
  /** 工作量 */
  workload_qty: number;
  /** 工作量单位	1.小时 2.日 3.月 */
  workload_unit: string;
  /** 变更原因 */
  change_reason: string;
  /** 单别信息 */
  doc_type_info: DocTypeInfo[]
  /** 任务模板类型编号 */
  task_template_no: string;
  /** 负责人 */
  liable_person_code_data?: any;
  liable_person_code: string;
  /**  */
  liable_person_name: string;
  /**  */
  liable_person_department_name: string;
  /** 负责人部门 */
  liable_person_department_code: string;
  /** 交付物	true：是 false：否 */
  is_attachment: boolean;
  /** 交付物说明 */
  attachment_remark: string;
  /** 备注 */
  remark: string;
  /** 签核否	true.需签核 false.无需签核 */
  is_approve: boolean;
  /** 必要任务	true：是 false：否 */
  required_task: boolean;
  /** 报工说明 */
  remarks: string;
  /** 任务名称 */
  task_no: string;
  /** 任务成员信息 */
  task_member_info: TaskMemberInfo[];
  /** 计划开始日期 */
  plan_start_date: string;
  /** 计划结束日期 */
  plan_finish_date: string;
  /** 预计工时 */
  plan_work_hours: number;
  /** 任务依赖信息 */
  task_dependency_info: TaskDependencyInfo[];
  /** 单别信息 */
  doc_type_info: DocTypeInfo[];
  /** 品号类别/群组 */
  item_type: string;
  /** 品号类别条件值 */
  item_type_value: string;
  /** 料号运算符 */
  item_operator: string;
  /** 料号条件值 */
  item_condition_value: string;
  /** 单别 */
  doc_type_no?: any;
  /** 单号 */
  doc_no?: any;
  /** 托外条件值 */
  outsourcing_condition_value?: any;
  /** 交付物樣板 */
  attachment: Attachment;
  /** 需要单别及单号	true：是 false： */
  is_need_doc_no: boolean;
  /**  */
  task_status: string;
  /** 顺序	由前端记录任务新增的顺序 */
  sequence: number;
  /** 任务分类编号 */
  task_classification_no: string;
  /** 任务分类名称 */
  task_classification_name: string;
  /** 难度等级 */
  difficulty_level_no: string;
  /**  */
  difficulty_level_name: string;
  /**  */
  difficulty_coefficient: number;
  /** 任务比重 */
  task_proportion: number;
  /** 主单位	0.无 1.工时 2.重量 3.张数 4.数量 5.项数 */
  main_unit: string;
  /** 次单位	0.无 1.工时 2.重量 3.张数 4.数量 5.项数 */
  second_unit: string;
  /** 预计值(主单位) */
  plan_main_unit_value: number;
  /** 预计值(次单位) */
  plan_second_unit_value: number;
  /** 标准工时 */
  standard_work_hours: number;
  /** 标准天数 */
  standard_days: number;
  /** 记录任务变更	true：是 false：否 默认true */
  record_task_change: boolean;
  /** 项目编号 */
  project_no: string;
  /** 任务模板类型编号 */
  task_template_no: number;
  /** 任务模板类型名称 */
  task_template_name: string;
  /** 任务类型 */
  task_category: string;
  /** 云端营运公司编号 */
  eoc_company_id: string;
  /** 云端营运据点编号 */
  eoc_site_id: string;
  /** 	云端营运域编号 */
  eoc_region_id: string;
  /** 款项阶段编号 */
  ar_stage_no: string;
  /** 款项阶段名称 */
  ar_stage_name: string;
  /** 单据日期条件	true：是 false：否 */
  is_doc_date: boolean;
  /** 确认日期条件	true：是 false：否 */
  is_confirm_date: boolean;
  /** 项目编号条件	true：是 false：否 */
  is_project_no: boolean;
  /** 任务编号条件	true：是 false：否 */
  is_task_no: boolean;
  /** 完成率计算方式	1.笔数 2.数量 3.天数 */
  complete_rate_method: string;
  /** 类型栏位代号 */
  type_field_code: string;
  /** 次类型栏位代号 */
  sub_type_field_code: string;
  /** 托外栏位代号 */
  outsourcing_field_code: string;
  /** 同步稳态	Y.同步；N.不同步 不传或传null，默认Y */
  sync_steady_state: string;
  /** 操作用户 */
  operation_no: string;
  /** 操作用户名称 */
  operation_name: string;
}


