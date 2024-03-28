export const getHeadGroupCop = () => {
  return [
    {
      type: 'input',
      schema: 'equipment_no',
      headerName: '设备号',
    },
    {
      type: 'input',
      schema: 'equipment_name',
      headerName: '设备名称',
    },
    {
      type: 'input',
      schema: 'project_score',
      headerName: '项目评分',
    },
    {
      type: 'input',
      schema: 'business_type',
      headerName: '业务类型',
    },
  ];
};
export const getOpportunityInformationGroupCop = () => {
  return [
    {
      type: 'input',
      schema: 'primary_customers',
      headerName: '客户一级',
    },
    {
      type: 'input',
      schema: 'secondary_customers',
      headerName: '客户二级',
    },
    {
      type: 'date',
      schema: 'start_date',
      headerName: '启动时间',
    },
    {
      type: 'date',
      schema: 'estimated_pr_date',
      headerName: '预计PR时间',
    },
    {
      type: 'input',
      schema: 'business_customer_budget',
      headerName: '客户预算',
    },
    {
      type: 'input',
      schema: 'self_made_and_outsourced',
      headerName: '自制&外协',
    },
    {
      type: 'percentInput',
      schema: 'success_rate',
      headerName: '成功率',
    },
    {
      type: 'date',
      schema: 'estimated_po_date',
      headerName: '预计PO时间',
    },
    {
      type: 'textarea',
      schema: 'business_sales_strategy',
      headerName: '销售策略',
    },
    {
      type: 'textarea',
      schema: 'schedule',
      headerName: '进度&安排',
    },
  ];
};
export const getClueInformationGroupCop = () => {
  return [
    {
      type: 'input',
      schema: 'take_on',
      headerName: '担当',
    },
    {
      type: 'input',
      schema: 'sources_of_clues',
      headerName: '线索来源',
    },
    {
      type: 'input',
      schema: 'priority_seq',
      headerName: '优先级',
    },
    {
      type: 'input',
      schema: 'docking_personnel_level',
      headerName: '对接人员级别',
    },
    {
      type: 'input',
      schema: 'clues_customer_budget',
      headerName: '客户预算',
    },
    {
      type: 'date',
      schema: 'demand_date',
      headerName: '需求日期',
    },
    {
      type: 'input',
      schema: 'demand_qty',
      dataType: 'numeric',
      headerName: '需求数量',
    },
    {
      type: 'checkbox',
      schema: 'transfer_to_business_opportunity',
      headerName: '是否转商机',
    },
    {
      type: 'textarea',
      schema: 'competitor_information',
      headerName: '竟手信息',
    },
    {
      type: 'textarea',
      schema: 'previous_purchase_history',
      headerName: '前购历史',
    },
    {
      type: 'textarea',
      schema: 'demand_reason',
      headerName: '需求原因',
    },
    {
      type: 'textarea',
      schema: 'current_situation_description',
      headerName: '现状描述',
    },
    {
      type: 'textarea',
      schema: 'clues_sales_strategy',
      headerName: '销售策略',
    },
    {
      type: 'textarea',
      schema: 'loss_sales_reason',
      headerName: '失销原因',
    },
  ];
};
