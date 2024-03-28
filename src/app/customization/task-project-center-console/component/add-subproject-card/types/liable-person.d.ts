/*
* @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export interface IPersonListItem {
  key?: string,
  title?: string,
  roleNo?: string, // 角色编号
  roleName?: string, // 角色名称
  /** 部门编号 */
  deptId: string;
  /** 部门名称 */
  deptName: string;
  /** 员工编号 */
  id: string;
  /** 用戶id */
  userId: string;
  /** 员工名称 */
  name: string;
  /** 是否禁用 */
  taskDisabled: boolean;
  /** 是否选中 */
  check: boolean;
  isSelected?: boolean,
  isLeaf?: boolean,
  selected?: boolean, // 设置节点本身是否选中
  checked?: boolean, // 设置节点 Checkbox 是否选中
  selectable?: boolean, // true, 可以选择
  disabled?: boolean // false, 设置是否禁用节点(不可进行任何操作)
}


export interface ISetPeopleList {
  /** 接口获取的原始数据 */
  list: any[]
  /** 负责人信息 */
  liable_person_code_data: any;
  /** 负责人下拉列表 */
  liable_person_code_dataList: any[];
  /** 记录原始的负责人数据 */
  originPersonList: any[];
  /** 执行人 */
  task_member_info?: any[];
  task_member_infoList: any[];
  task_member_infoList_other?: any[];
}

export interface ICheckPersonLiable {
  /**  */
  employee_info: any[]
  /** 错误信息 */
  error_msg: string
}
