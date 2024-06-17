import { AddSubprojectCardComponent } from '../component/add-subproject-card/add-subproject-card.component';

/**
 * s-10：任务名称提交时校验特殊字符
 */
export const scheduleACommitCheck = (target, name, descriptor): any => {
  const original = descriptor.value;
  descriptor.value = function (...args) {
    const self = this as AddSubprojectCardComponent;
    // 提交时候如果原来是禁用的则不校验
    if (self.validateForm.get('task_name').disabled) {
      return original.apply(this, args);
    }
    // 首尾不允许空格
    if (/^\s|\s$/g.test(self.validateForm.get('task_name').value)) {
      return self.athMessageService.error('任务名称包含特殊字符！');
    }
    // 存在特殊字符
    if (
      /[^a-zA-Z0-9\u4E00-\u9FA5_＿－\-（）()[\]［］【】&＆+＋.．、,，\s]/g.test(
        self.validateForm.get('task_name').value
      )
    ) {
      return self.athMessageService.error('任务名称包含特殊字符！');
    }
    // 否则执行
    return original.apply(this, args);
  };
  return descriptor;
};
