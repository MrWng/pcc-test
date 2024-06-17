import * as moment from 'moment';

class BasicClass {
  /**
   * 合并数据
   * @param data 数据对象
   */
  extend(data: any = {}, classTransMap = {}): void {
    Object.entries(data).forEach((o): void => {
      if (classTransMap.hasOwnProperty(o[0])) {
        if (Array.isArray(data[o[0]])) {
          data[o[0]].forEach((item) => {
            this[o[0]].push(new classTransMap[o[0]](item));
          });
        } else {
          this[o[0]] = new classTransMap[o[0]](data[o[0]]);
        }
        return;
      }
      this[o[0]] = data[o[0]];
    });
  }
  getKeys() {
    return Object.keys(this);
  }
}
// 表格表单用
class RiskMaintenance extends BasicClass {
  // 项目编号
  project_no: string = null;
  // 项目风险序号
  project_risk_seq: number = null;
  // 任务编号
  task_no: string = null;
  // 任务名称
  task_name: string = null;
  // 风险描述编号
  risk_description_no: string = null;
  // 风险描述名称
  risk_description_name: string = null;
  // 风险类型编号
  risk_type_no: string = null;
  // 风险类型名称
  risk_type_name: string = null;
  // 风险等级编号
  risk_level_no: string = null;
  // 风险等级名称
  risk_level_name: string = null;
  // 风险影响编号
  risk_effect_no: string = null;
  // 风险影响名称
  risk_effect_name: string = null;
  // 预防措施
  prevention_measure: string = null;
  // 应对措施
  reply_measure: string = null;
  // 风险状态
  risk_status: string = '1';
  // 风险处理状态
  risk_handle_status: string = null;
  // 通知方式
  notice_mode: string = null;
  // 派送否
  is_dispatch: boolean = false;
  // 备注
  remark: string = null;
  // 发生日期
  happen_date: Date = null;
  // 派送时间
  dispatch_time: string = null;
  // 失效日期
  expiration_date: Date = null;
  // 风险通知人员
  risk_notifier_info: RiskNotifierInfo[] = [];
  // 状态 0 - 初始状态 1 - 新增 2 - 编辑 3 - 删除
  isChanged: number = 0;
  constructor(data) {
    super();
    this.extend(data, {
      risk_notifier_info: RiskNotifierInfo,
    });
  }
  dataFormat(data) {
    data['happen_date'] = data['happen_date']
      ? moment(data['happen_date']).format('YYYY/MM/DD')
      : null;
    data['expiration_date'] = data['expiration_date']
      ? moment(data['expiration_date']).format('YYYY/MM/DD')
      : null;
  }
}

class RiskNotifierInfo extends BasicClass {
  // 员工编号
  employee_no: string = null;
  // 员工名称
  employee_name: string = null;
  // 处理说明
  process_illustrate: string = null;
  // 风险处理状态
  risk_handle_status: string = null;
  // 回复日期
  reply_date: Date = null;
  // 备注
  remark: string = null;
  constructor(data) {
    super();
    this.extend(data);
  }
}

export default {
  RiskMaintenance,
  RiskNotifierInfo,
};
