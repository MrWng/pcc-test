/*
* @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export interface ProductInfo {
  product_type: string;
}

export interface ITaskTemplate {
  parameter_no: number;
  parameter_name: string;
  task_category: string;
  doc_condition_value: string;
  item_operator: string;
  item_condition_value: string;
  is_doc_date: boolean;
  is_confirm_date: boolean;
  is_project_no: boolean;
  is_task_no: boolean;
  eoc_company_id: string;
  eoc_site_id: string;
  eoc_region_id: string;
  new_task_category: string;
  complete_rate_method: string;
  item_type: string;
  item_type_value: string;
  item_type_name: string;
  type_field_code: string;
  sub_type_field_code: string;
  outsourcing_field_code: string;
  product_info: ProductInfo[];
  __DATA_KEY: string;
}
