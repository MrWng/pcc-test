export interface Attachment {
    /**  */
    data: any[];
    /**  */
    row_data: string;
}
export interface TaskInfoGet {
    /** 项目编号 */
    project_no: string;
    /** 任务编号 */
    task_no: string;
    /** 任务名称 */
    task_name: string;
    /** 报工说明 */
    report_work_description: string;
    /** 项目预计开始日 */
    project_plan_start_date: string;
    /** 项目预计完成日 */
    project_plan_finish_date: string;
    /** 项目名称 */
    project_name: string;
    /** 合同编号 */
    contract_no: string;
    /** 业务员编号 */
    sales_no: string;
    /** 业务员名称 */
    sales_name: string;
    /** 项目负责人编号	 */
    project_leader_code: string;
    /** 项目负责人名称 */
    project_leader_name: string;
    /** 业务资讯 */
    business_info: string;
    /** 耗用总工时 */
    total_work_hours: number;
    /** 产品别 */
    product_type: string;
    /** 前置任务编号 */
    before_task_no: string;
    /** 前置任务完成率 */
    before_task_complete_rate: number;
    /** 交付物樣板 */
    attachment: Attachment;
    /** 公司别 */
    company_no: string;
    /** 上阶任务编号 */
    upper_level_task_no: string;
    /** 任务状态 10.未开始 20.进行中(任务报工时回写) 30.已完成(任务报工时回写) 40.指定完成 (画面按钮user指定) 50.暂停 (画面按钮user指定) 60.签核中 */
    task_status: string;
    /** 工作量 */
    workload_qty: number;
    /** 工作量单位	1.天 2.月 3.年 */
    workload_unit: string;
    /** 预计开始日	yyyyMMddHHmmss */
    plan_start_date: string;
    /** 预计完成日	yyyyMMddHHmmss */
    plan_finish_date: string;
    /** 实际开始日	yyyyMMddHHmmss */
    actual_start_date: string;
    /** 实际完成日	yyyyMMddHHmmss */
    actual_finish_date: string;
    liable_person_code_data?: any;
    /** 负责人编号 */
    liable_person_code: string;
    /** 负责人名称 */
    liable_person_name: string;
    /** 负责人部门编号 */
    liable_person_department_code: string;
    /** 负责人部门名称 */
    liable_person_department_name: string;
    liable_person_role_no?: string;
    liable_person_role_name?: string;
    /** 完成率 */
    complete_rate: number;
    /** 任务类型 */
    task_category: string;
    /** 新完成率 */
    new_complete_rate: number;
    /** 新任务类型 */
    new_task_category: string;
    /** 任务标签	1:前置任务未完成 2:前置任务提前完成 3:无 4:项目暂停 */
    task_tag: string;
    /**	任务标签说明	依据任务标签回传值： 前置任务未完成； 前置任务提前完成； 无； 项目暂停  */
    task_tag_description: string;
    /** 是否里程碑	true：是 false：否 */
    is_milepost: boolean;
    /** 工时 */
    work_hours: number;
    /** 交付物	true：是 false：否  */
    is_attachment: boolean;
    /**	签核	true.需签核 false.无需签核  */
    is_approve: boolean;
    /** 项目状态	10.潜在 20.正式 30.进行中(项目作业执行启动功能时回写) 40.已结案 50.暂停 60.指定结案  */
    project_status: string;
    /** 顺序	由前端记录任务新增的顺序 */
    sequence: number;
    /** 云端营运公司编号 */
    eoc_company_id: string;
    /** 云端营运据点编号 */
    eoc_site_id: string;
    /** 云端营运域编号 */
    eoc_region_id: string;
    /** 任务模板类型编号 */
    task_template_no: number;
    /** 任务模板类型名称 */
    task_template_name: string;
    /** 任务说明 */
    attachment_remark: string;
    /** 款项阶段编号	 */
    ar_stage_no: string;
    /** 款项阶段名称	 */
    ar_stage_name: string;
    /** 历史报工说明	 */
    remarks: string;
    /** 预计工时 */
    plan_work_hours: number;
    /** 是否依设备清单展开 true：是 false：否  */
    is_equipment_list_unfold: boolean;
    /** 外显项目编号 */
    display_project_no: string;
    /** 单别条件值 */
    doc_condition_value: string;
    /** 料号运算符 */
    item_operator: string;
    /** 料号条件值 */
    item_condition_value: string;
    /** 单据日期条件 true：是 false：否 */
    is_doc_date: boolean;
    /** 确认日期条件  */
    is_confirm_date: boolean;
    /** 项目编号条件 */
    is_project_no: boolean;
    /** 任务编号条件 */
    is_task_no: boolean;
    /** 是否已发任务卡 */
    is_issue_task_card: boolean;
    /** 完成率计算方式 */
    complete_rate_method: string;
    /**	品号类别/群组  */
    item_type: string;
    /** 品号类别条件值	 */
    item_type_value: string;
    /** 品号类别/群组名称 */
    item_type_name: string;
    /** 单别 */
    doc_type_no: string;
    /** 单号  */
    doc_no: string;
    /** 序号 */
    seq: string;
    /** 逾期天数 */
    overdue_days: string;
    /** 类型栏位代号	 */
    type_field_code: string;
    /** 次类型栏位代号	 */
    sub_type_field_code: string;
    /** 类型条件值 */
    type_condition_value: string;
    /** 次类型条件值 */
    sub_type_condition_value: string;
    /** 托外栏位代号	 */
    outsourcing_field_code: string;
    /** 托外条件值 */
    outsourcing_condition_value: string;
    /**	里程碑说明  */
    milepost_desc: string;
    /** 需要单别及单号  true：是 false：否 */
    is_need_doc_no: boolean;
    /** 备注 */
    remark: string;
    /**	任务分类编号	  */
    task_classification_no: string;
    /**	任务分类名称	  */
    task_classification_name: string;
    /**	必要任务  */
    required_task: boolean;
    /** 任务成员信息 */
    task_member_info: any[];
    /** 任务依赖信息 */
    task_dependency_info: any[];
    /**	任务报工资讯  */
    task_report_info: any[];
    /**	主单位  */
    main_unit: string;
    /**	次单位  */
    second_unit: string;
    /**	预计值(主单位)  */
    plan_main_unit_value: number;
    /**	预计值(次单位)	  */
    plan_second_unit_value: number;
    /**	标准工时  */
    standard_work_hours: number;
    /**	标准工时  */
    standard_days: number;
    /** 任务比重  */
    task_proportion: number;
    /** 难度等级 */
    difficulty_level_no: string;
    /**	已完成(主单位)	  */
    complete_main_unit_value: number;
    /** 已完成(次单位)	  */
    complete_second_unit_value: number;
    /**	实际天数	  */
    actual_days: number;
    /**	已返工图数	  */
    complete_rework_drawing_qty: number;
    /**	已返工工时	  */
    complete_rework_work_hours: number;
    /** 已返工天数	 */
    complete_rework_days: number;
    /** 实际值(主单位)	 */
    main_unit_actual_value: number;
    /**	实际值(次单位)	  */
    second_unit_actual_value: number;
    /** 难度等级名称	  */
    difficulty_level_name: string;
    /** 难度系数	  */
    difficulty_coefficient: number;
    /** 返工图数	 */
    rework_drawing_qty: number;
    /**	返工工时  */
    rework_work_hours: number;

    level?: number;
    /** 是否是协同任务卡 */
    isCollaborationCard?: string
    /** 任务状态大于 > 10 ? true : false */
    someEdit?: boolean
    /**  */
    hasEdit?: boolean
}
