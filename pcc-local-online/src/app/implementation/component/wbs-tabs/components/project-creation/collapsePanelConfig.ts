//  基础信息所有栏位
const getColumns = () => ({
  project_type_name: '项目类型名称',
  project_leader_name: '项目负责人名称',
  project_set_no: '项目集编号',
  remark: '特别资讯',
  belong_company_no: '归属公司别',
  project_property: '项目性质',
  project_level_no: '项目等级',
  customer_no: '客户编号',
  potential_project_no: '潜在项目编号',
  remarks: '备注',
  project_no: '项目编号',
  project_introduction: '项目简介',
  customer_shortname: '客户简称',
  actual_start_date: '实际开始日期',
  budget_planning: ' 预算编制',
  project_name: '项目名称',
  enter_scene_date: '进场日期',
  project_contact_name: '项目联系人',
  actual_finish_date: '实际完成日',
  change_version: '版本',
  project_days: '项目天数',
  contract_no: '合同编号',
  contact_tel_no: '联系人电话',
  key_date: '预计出货日',
  attachment: '项目附件',
  project_set_plan_start_date: '计划起讫时间',
  sales_no: '业务员',
  address: '联系人地址',
  plan_summary_qty: '预计总数量',
  change_attachment: '项目变更附件',
  change_reason: '变更原因',
  to_be_formal_option: '转正式选项',
  coding_rule_no: '编码规则',
  actionCode: '项目编号编码方式',
  project_set_plan_date: '项目集计划起讫时间',
  project_set_leader_name: '项目集负责人',
});

// 所有栏位的key
const allColKeys = Object.keys(getColumns());
// 基本信息展示的栏位
const getBaseCol = () => {
  return [
    'project_type_name',
    'project_leader_name',
    'project_set_no',
    'belong_company_no',
    'project_property',
    'potential_project_no',
    'project_no',
    'project_introduction',
    'actual_start_date',
    'project_name',
    'actual_finish_date',
    'project_days',
    'project_set_plan_start_date',
    'project_level_no',
    'to_be_formal_option',
    'coding_rule_no',
    'actionCode',
    'project_set_plan_date',
    'project_set_leader_name',
  ];
};
// 合同信息展示的栏位
const getContractCol = () => {
  return [
    'contract_no',
    'customer_no',
    'customer_shortname',
    'sales_no',
    'enter_scene_date',
    'key_date',
    'plan_summary_qty',
    'products_no',
  ];
};
// 其他信息展示的栏位
const getOtherCol = () => {
  return [
    'project_contact_name',
    'address',
    'contact_tel_no',
    'budget_planning',
    'attachment',
    'change_version',
    'remark',
    'remarks',
    'change_attachment',
    'change_reason',
  ];
};

// eslint-disable-next-line no-shadow
enum CollapsePanelName {
  BASE_NAME = 'dj-pcc-基础信息',
  CONTRACT_INFORMATION = 'dj-pcc-合同信息',
  ADDITIONAL_INFORMATION = 'dj-pcc-其他信息',
}

export const filterCol = (type: string) => {
  let cols = [];
  switch (type) {
    case CollapsePanelName.BASE_NAME:
      cols = getBaseCol();
      break;
    case CollapsePanelName.CONTRACT_INFORMATION:
      cols = getContractCol();
      break;
    case CollapsePanelName.ADDITIONAL_INFORMATION:
      cols = getOtherCol();
      break;
  }
  return cols;
};

export const initCollapsePanels = (source) => {
  return [
    {
      active: true,
      name: CollapsePanelName.BASE_NAME,
      filterFormItem: filterCol(CollapsePanelName.BASE_NAME),
    },
    {
      active: true,
      name: CollapsePanelName.CONTRACT_INFORMATION,
      filterFormItem: filterCol(CollapsePanelName.CONTRACT_INFORMATION),
    },
    {
      active: true,
      name: CollapsePanelName.ADDITIONAL_INFORMATION,
      filterFormItem: filterCol(CollapsePanelName.ADDITIONAL_INFORMATION),
    },
  ];
};
