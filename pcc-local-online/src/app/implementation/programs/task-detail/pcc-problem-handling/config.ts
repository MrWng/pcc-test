export const mode = {};
// eslint-disable-next-line no-shadow
export enum ProcessStatusMap { // 用于问题处理事项编辑开窗，处理状态
  NO_DONE = '8',
  DONE = '4',
  EMPTY = '-1',
}

export const processStatus = [
  // 用于问题处理事项编辑开窗，处理状态组件下拉选项
  {
    value: ProcessStatusMap.NO_DONE,
    key: '未完成',
  },
  {
    value: ProcessStatusMap.DONE,
    key: '已完成',
  },
];

// eslint-disable-next-line no-shadow
export enum QuestDoStatus {
  // 问题处理事项表格,处理状态
  DONE = '4',
  INCOMPLETION = '8',
  TRANSFERRED_TASKS = '3',
}

// eslint-disable-next-line no-shadow
export enum QuestPageType {
  // 问题清单页面使用类型
  BASIC_INFORMATION = '1',
  PROBLEM_HANDLING = '2',
  PROBLEM_ACCEPTANCE = '3',
  THE_ISSUE_IS_BOUNCED = '4', // 问题退回
}

// eslint-disable-next-line no-shadow
export enum QuestPageDataStatus {
  // 问题清单当前页面数据处理状态
  PENDING = '2', // 待处理
  ACCEPTANCE = '3', // 验收中
  RETURN_AND_REDO = '4', // 退回重办;
  DONE = '99', // 已完成;
  TRANSFERRED = '7', // 已转派;
}

// eslint-disable-next-line no-shadow
export enum ProblemExecutionMethod {
  // 执行方式
  TRANSFER = '4',
  HANDLE = '3',
  NO_PASS = '7',
  PASS = '6',
  CREATE = '1', // 创建
  ASSIGN = '2', // 指派
  REGRESSION = '5', // 退回
}
