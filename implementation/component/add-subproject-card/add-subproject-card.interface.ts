// eslint-disable-next-line no-shadow
export enum ButtonType {
  CREATE = 1, // 新建一级计划
  ADD, // 添加子项
  PLUS, // +号按钮，添加子项
  EDIT, // 编辑任务卡
  DELETE, // 删除任务卡
  PREVIEW, // 预览
}

// 任务卡信息
export interface TaskBaseInfo {
  project_no?: string,						//	项目编号
  task_no?: string,							// 任务编号
  task_name?: string,						// 	任务名称
  project_no_mistake_message?: string		// 项目编号错误讯息
  error_msg?: string		// 项目编号错误讯息
}

export interface Attachment {
  data: any[];
  row_data: string;
}

export interface TaskInfoGet {
  project_no: string;
  task_no: string;
  task_name: string;
  project_name: string;
  contract_no: string;
  sales_no: string;
  sales_name: string;
  project_leader_code: string;
  project_leader_name: string;
  business_info: string;
  total_work_hours: number;
  product_type: string;
  before_task_no: string;
  before_task_complete_rate: number;
  attachment: Attachment;
  company_no: string;
  upper_level_task_no: string;
  task_status?: string;
  old_task_status?: string; // 原任務狀態
  workload_qty: number;
  workload_unit: string;
  plan_start_date: string;
  plan_finish_date: string;
  actual_start_date: string;
  actual_finish_date: string;
  liable_person_code_data?: any;
  liable_person_code?: string;
  liable_person_name?: string;
  liable_person_department_code?: string;
  liable_person_department_name?: string;
  responsible_person_no?:string; // 負責人
  responsible_person_name?: string; // 負責人名稱
  responsibility_department_no?: string; // 負責人部門編號
  responsibility_department_name?: string; // 負責人部門名稱
  liable_person_role_no?: string;
  liable_person_role_name?: string;
  complete_rate: number;
  task_category: string;
  new_complete_rate: number;
  new_task_category: string;
  task_tag: string;
  task_tag_description: string;
  is_milepost: boolean;
  work_hours: number;
  is_attachment: boolean;
  is_approve: boolean;
  project_status: string;
  sequence: number;
  eoc_company_id: string;
  eoc_site_id: string;
  eoc_region_id: string;
  task_template_no?: number;
  task_template_name?: string;
  task_template_parameter_no?: number; // 任務範本參數編號
  task_template_parameter_name?: string; // 任務範本參數名稱
  attachment_remark: string;
  ar_stage_no: string;
  ar_stage_name: string;
  remarks: string;
  plan_work_hours: number;
  is_equipment_list_unfold: boolean;
  display_project_no: string;
  doc_condition_value: string;
  item_operator: string;
  item_condition_value: string;
  is_doc_date: boolean;
  is_confirm_date: boolean;
  is_project_no: boolean;
  is_task_no: boolean;
  is_issue_task_card: boolean;
  complete_rate_method: string;
  item_type: string;
  item_type_value: string;
  item_type_name: string;
  doc_type_no: string;
  doc_no: string;
  seq: string;
  type_field_code: string;
  sub_type_field_code: string;
  type_condition_value: string;
  sub_type_condition_value: string;
  outsourcing_field_code: string;
  outsourcing_condition_value: string;
  milepost_desc: string;
  is_need_doc_no: boolean;
  remark: string;
  task_classification_no: string;
  task_classification_name: string;
  required_task: boolean;
  task_member_info?: TaskMemberInfo[];
  assist_task_member_info?: TaskMemberInfo[];
  task_dependency_info?: any[];
  assist_task_dependency_info?: any[];
  task_report_info: any[];
  main_unit: string;
  second_unit: string;
  plan_main_unit_value: number;
  plan_second_unit_value: number;
  standard_work_hours: number;
  standard_days: number;
  task_proportion: number;
  difficulty_level_no: string;
  complete_main_unit_value: number;
  complete_second_unit_value: number;
  actual_days: number;
  complete_rework_drawing_qty: number;
  complete_rework_work_hours: number;
  complete_rework_days: number;
  main_unit_actual_value: number;
  second_unit_actual_value: number;
  difficulty_level_name: string;
  difficulty_coefficient: number;
  rework_drawing_qty: number;
  rework_work_hours: number;
  children: any[]
}
export interface TaskMemberInfo {
  project_no: string				//	项目编号
  task_no: string						//	任务编号
  executor_no: string					// 执行人编号
  executor_name?: string					// 执行人名称
  executor_department_no?: string					//		执行人部门编号
  executor_department_name?: string					//		执行人部门名称
  executor_role_no?: string					//		执行人角色编号
  executor_role_name?: string					//		执行人角色名称
}



