export interface ICustomAppConfig {
  /** 定制应用名称 */
  appCode: string;
  moduleName: string;
  modulePath: string;
}

export interface IProgramInfo {
  [key: string]: IProgramInfoParams;
}

export interface IProgramInfoParams {
  /** 定制页路径 */
  sourceRoot?: string;
  /** 页面type */
  type?: string;
  /** json路径 */
  jsonPath: string;
  /** 定制页说明 */
  description?: string;
}

/** 定制应用配置 */
export const CUSTOM_APP_CONFIG: ICustomAppConfig = {
  appCode: 'PCC',
  moduleName: 'TaskProjectCenterConsoleModule',
  modulePath: './src/app/implementation/athena-app.module.ts',
};

/** 定制页信息 */
export const programs: IProgramInfo = {
  pccProjectInfo: {
    jsonPath: '/assets/api/api-pcc_project_info.json',
    description: '手动任务项目信息',
  },
  pccCommonCustomAttachment: {
    jsonPath: '/assets/api/api-pcc-common-custom-attachment.json',
    description: '通用自定义附件',
  },
  pccProblemViewAttachment: {
    jsonPath: '/assets/api/api-pcc_problem_view_attachment.json',
    description: '问题处理转任务页面查看问题附件',
  },
  pccProblemViewHistory: {
    jsonPath: '/assets/api/api-pcc_problem_view_history.json',
    description: '问题处理转任务页面查看历程',
  },
  UCMomaDTDAssignmentTaskDetailWaitting: {
    jsonPath: '/assets/api/api-UC_moma_DTD_Assignment-task-detail-waitting.json',
    description: '诚亿个案-工单发料',
  },
  CUSTPCCPROJECTCHANGE: {
    jsonPath: '/assets/api/api-CUST_PCC_PROJECT_CHANGE.json',
    description: 'test',
  },
  gaosiaoOtherInfo: {
    jsonPath: '/assets/api/api-gaosiao-other-info.json',
    description: '光斯奥其他信息页签',
  },
  pccProblemHandling: {
    sourceRoot:
      '/src/app/customization/task-project-center-console/dynamic-component/task-detail-waitting/pcc-problem-handling',
    type: 'pcc-problem-handling',
    jsonPath: '/assets/api/api-pcc-problem-handling-task-detail-waitting.json',
    description: '问题处理',
  },
  pccRiskMaintenanceTableOperate: {
    sourceRoot:
      '/src/app/implementation/programs/project-detail/pcc-risk-maintenance-table-operate',
    type: 'pcc-risk-maintenance-table-operate-project-detail',
    jsonPath: '/assets/api/api-pcc-risk-maintenance-table-operate-project-detail.json',
    description: '风险项表格操作栏',
  },
  pccRiskMaintenanceTableAdd: {
    sourceRoot: '/src/app/implementation/programs/project-detail/pcc-risk-maintenance-table-add',
    type: 'pcc-risk-maintenance-table-add-project-detail',
    jsonPath: '/assets/api/api-pcc-risk-maintenance-table-add-project-detail.json',
    description: '风险项右上角新增按钮',
  },
  projectDeliverable: {
    sourceRoot: '/src/app/implementation/programs/project-detail/project-deliverable',
    type: 'pcc_deliverable',
    jsonPath: '/assets/api/api-project-deliverable-project-detail.json',
    description: '项目卡交付物',
  },
  apcOTaskCard: {
    sourceRoot: '/src/app/implementation/programs/task-detail/apc-o-task-card',
    type: 'apc-o-task-card-task-detail',
    jsonPath: '/assets/api/api-apc-o-task-card-task-detail.json',
    description: 'apc-o任务卡',
  },
  apcTaskCard: {
    sourceRoot: '/src/app/implementation/programs/task-detail/apc-task-card',
    type: 'apc-task-card-task-detail',
    jsonPath: '/assets/api/api-apc-task-card-task-detail.json',
    description: 'APC任务卡',
  },
  basicDataTemplateManage: {
    sourceRoot: '/src/app/implementation/programs/basic-data/basic-data-template-manage',
    type: 'basic-data-template-manage-basic-data',
    jsonPath: '/assets/api/api-basic-data-template-manage-basic-data.json',
    description: '基础资料-专案模版维护',
  },
  posumTaskCard: {
    sourceRoot: '/src/app/implementation/programs/task-detail/posum-task-card',
    type: 'posum-task-card-task-detail',
    jsonPath: '/assets/api/api-posum-task-card-task-detail.json',
    description: '采购汇总任务卡',
  },
  cooperationTask: {
    sourceRoot: '/src/app/implementation/programs/task-detail/cooperation-task',
    type: 'cooperation-task-task-detail',
    jsonPath: '/assets/api/api-cooperation-task-task-detail.json',
    description: '协同任务卡（wbs页面）',
  },
  progressTrack: {
    sourceRoot: '/src/app/implementation/programs/project-detail/progress-track',
    type: 'progress-track-project-detail',
    jsonPath: '/assets/api/api-progress-track-project-detail.json',
    description: '进度追踪',
  },
  projectPlanManage: {
    sourceRoot: '/src/app/implementation/programs/project-detail/project-plan-manage',
    type: 'project-plan-manage-project-detail',
    jsonPath: '/assets/api/api-project-plan-manage-project-detail.json',
    description: '项目卡-项目计划维护',
  },
  frontTask: {
    sourceRoot: '/src/app/implementation/programs/task-detail/front-task',
    type: 'front-task-task-detail',
    jsonPath: '/assets/api/api-front-task-task-detail.json',
    description: '前置任务',
  },
  sftTaskCard: {
    sourceRoot: '/src/app/implementation/programs/task-detail/sft-task-card',
    type: 'sft-task-card-task-detail',
    jsonPath: '/assets/api/api-sft-task-card-task-detail.json',
    description: 'SFT任务卡',
  },
  projectProcessRoute: {
    sourceRoot: '/src/app/implementation/programs/project-detail/project-process-route',
    type: 'project-process-route-project-detail',
    jsonPath: '/assets/api/api-project-process-route-project-detail.json',
    description: '子项目信息',
  },
  projectDetail: {
    sourceRoot: '/src/app/implementation/programs/task-detail/project-detail',
    type: 'project-detail-task-detail',
    jsonPath: '/assets/api/api-project-detail-task-detail.json',
    description: '任务卡-项目计划入口',
  },
  projectInfoMaintain: {
    sourceRoot: '/src/app/implementation/programs/project-detail/project-info-maintain',
    type: 'project-info-maintain-project-detail',
    jsonPath: '/assets/api/api-project-info-maintain-project-detail.json',
    description: '母项目信息维护',
  },
  progressAnalysis: {
    sourceRoot: '/src/app/implementation/programs/basic-data/progress-analysis',
    type: 'progress-analysis-basic-data',
    jsonPath: '/assets/api/api-progress-analysis-basic-data.json',
    description: '进度分析',
  },
  // default: {
  //   sourceRoot: '/src/app/customization/APC/programs/basic-data/hello-world',
  //   type: 'hello-world-basic-data',
  //   jsonPath: '/assets/api/wbs.json',
  //   description: '默认页面'
  // },
};
