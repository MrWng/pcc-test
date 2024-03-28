// 任务卡信息
export interface TaskInfo {
  project_no?: string,		      // 项目编号
  seq?: string,	              // 序号
  task_no: string,	          // 任务编号
  task_name?: string,       	//	任务名称
  plan_start_date?: string,	  //	预计开始日	yyyyMMddHHmmss
  plan_finish_date?: string,	//	预计完成日	yyyyMMddHHmmss
  actual_start_date?: string,	//	实际开始日	yyyyMMddHHmmss
  actual_finish_date?: string,//	实际完成日	yyyyMMddHHmmss
}

export interface DependencyInfoList {
  data: string[]
}

// 关键路径
export interface CriticalPath {
  source: string,
  target: string,
}


