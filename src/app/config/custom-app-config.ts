export interface ICustomAppConfig {
  /** 定制应用名称 */
  appCode: string
}

export interface IProgramInfo {
  [key: string]: IProgramInfoParams
}

export interface IProgramInfoParams {
  /** 定制页路径 */
  sourceRoot: string
  /** 页面type */
  type: string
  /** json路径 */
  jsonPath: string
  /** 定制页说明 */
  description?: string
}

/** 定制应用配置 */
export const CUSTOM_APP_CONFIG: ICustomAppConfig = {
  appCode: 'PCC'
};

/** 定制页信息 */
export const programs: IProgramInfo = {
  projectDeliverable: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/project-detail/project-deliverable',
    type: 'pcc_deliverable',
    jsonPath: '/assets/api/api-project-deliverable-project-detail.json',
    description: '项目卡交付物'
  },
  apcOTaskCard: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/task-detail/apc-o-task-card',
    type: 'apc-o-task-card-task-detail',
    jsonPath: '/assets/api/api-apc-o-task-card-task-detail.json',
    description: 'apc-o任务卡'
  },
  apcTaskCard: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/task-detail/apc-task-card',
    type: 'apc-task-card-task-detail',
    jsonPath: '/assets/api/api-apc-task-card-task-detail.json',
    description: 'APC任务卡'
  },
  basicDataTemplateManage: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/basic-data/basic-data-template-manage',
    type: 'basic-data-template-manage-basic-data',
    jsonPath: '/assets/api/api-basic-data-template-manage-basic-data.json',
    description: '基础资料-专案模版维护'
  },
  posumTaskCard: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/task-detail/posum-task-card',
    type: 'posum-task-card-task-detail',
    jsonPath: '/assets/api/api-posum-task-card-task-detail.json',
    description: '采购汇总任务卡'
  },
  cooperationTask: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/task-detail/cooperation-task',
    type: 'cooperation-task-task-detail',
    jsonPath: '/assets/api/api-cooperation-task-task-detail.json',
    description: '协同任务卡（wbs页面）'
  },
  progressTrack: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/project-detail/progress-track',
    type: 'progress-track-project-detail',
    jsonPath: '/assets/api/api-progress-track-project-detail.json',
    description: '进度追踪'
  },
  projectPlanManage: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/project-detail/project-plan-manage',
    type: 'project-plan-manage-project-detail',
    jsonPath: '/assets/api/api-project-plan-manage-project-detail.json',
    description: '项目卡-项目计划维护'
  },
  frontTask: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/task-detail/front-task',
    type: 'front-task-task-detail',
    jsonPath: '/assets/api/api-front-task-task-detail.json',
    description: '前置任务'
  },
  sftTaskCard: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/task-detail/sft-task-card',
    type: 'sft-task-card-task-detail',
    jsonPath: '/assets/api/api-sft-task-card-task-detail.json',
    description: 'SFT任务卡'
  },
  projectProcessRoute: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/project-detail/project-process-route',
    type: 'project-process-route-project-detail',
    jsonPath: '/assets/api/api-project-process-route-project-detail.json',
    description: '子项目信息'
  },
  projectDetail: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/task-detail/project-detail',
    type: 'project-detail-task-detail',
    jsonPath: '/assets/api/api-project-detail-task-detail.json',
    description: '任务卡-项目计划入口'
  },
  projectInfoMaintain: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/project-detail/project-info-maintain',
    type: 'project-info-maintain-project-detail',
    jsonPath: '/assets/api/api-project-info-maintain-project-detail.json',
    description: '母项目信息维护'
  },
  progressAnalysis: {
    sourceRoot: '/src/app/customization/task-project-center-console/dynamic-component/basic-data/progress-analysis',
    type: 'progress-analysis-basic-data',
    jsonPath: '/assets/api/api-progress-analysis-basic-data.json',
    description: '进度分析'
  },
  // default: {
  //   sourceRoot: '/src/app/customization/APC/dynamic-component/basic-data/hello-world',
  //   type: 'hello-world-basic-data',
  //   jsonPath: '/assets/api/wbs.json',
  //   description: '默认页面'
  // },
};
