/**
   * 去除自身以及以下的层级
   * @param list
   * @param upper_level_task_no 上阶任务编号
   * @param task_no 任务编号
   * @returns
   */
export const deleteSelfList = (list: any, upper_level_task_no, task_no) => {
  if (Array.isArray(list)) {
    list.forEach((parent, index) => {
      if (parent.task_no === upper_level_task_no) {
        parent.children.forEach((child, childIndex) => {
          if (child.task_no === task_no) {
            parent.children.splice(childIndex, 1);
          }
        });
        if (parent.task_no === task_no) {
          list.splice(index, 1);
        }
      } else {
        deleteSelfList(parent.children, upper_level_task_no, task_no);
      }
    });
  }
  return list;
};

export const liablePersonName = (list: any, params) => {
  let liable_person_name = '';
  list?.forEach((person: any): void => {
    if (person.id === params.liable_person_code) {
      liable_person_name = person.name;
    }
  });
  return liable_person_name;
};
