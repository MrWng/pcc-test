import { Injectable } from '@angular/core';
import { AddSubProjectCardService } from '../add-subproject-card.service';

@Injectable()
export class LevelService {
  constructor(public addSubProjectCardService: AddSubProjectCardService) { }

  /**
   * 编辑任务卡没有层级
   * @param list
   * @returns
   */
  removeLevels(list: any): any {
    const currentCardInfo = this.addSubProjectCardService.currentCardInfo;
    if (Array.isArray(list)) {
      list.forEach((parent, index) => {
        if (parent.task_no === currentCardInfo.upper_level_task_no) {
          parent.children.forEach((child, childIndex) => {
            if (child.task_no === currentCardInfo.task_no) {
              parent.children.splice(childIndex, 1);
            }
          });
          if (parent.task_no === currentCardInfo.task_no) {
            list.splice(index, 1);
          }
        } else {
          this.removeLevels(parent.children);
        }
      });
    }
    return list;
  }

  /**
   * 操作树选择组件，符合要求规格
   * @param data 数组
   * @returns 符合树形结构的数组
   */
  setToTreeStructure(data: any, parentTaskNo: any): void {
    const { value } = this.addSubProjectCardService.validateForm;
    if (!Array.isArray(data)) {
      return;
    }
    data.forEach((item: any): void => {
      item.title = item.task_name;
      item.key = item.task_no;
      if (item.children?.length) {
        item.disabled = false;
        this.setToTreeStructure(item.children, parentTaskNo);
      } else {
        item.disabled = item.task_status > 10 ? true : false;
      }
      if (parentTaskNo?.includes(item.task_no)) {
        item.disabled = true;
      }
    });
  }


  /**
   * 平铺firstLevelTaskCard数据
   * @param firstLevelTaskCard
   * @returns
   */
  flattenFirstLevelTaskCard(firstLevelTaskCard): any {
    return firstLevelTaskCard?.reduce((result, item) => {
      if (item?.children?.length) {
        result.push(item, ...this.flattenFirstLevelTaskCard(item.children));
      } else {
        result.push(item);
      }
      return result;
    }, []);
  }


  /**
 * 获取所有上阶任务编号
 * @param firstLevelTaskCard
 * @returns
 */
  findParentItems(arr, targetItem) {
    const result = [];
    let current = targetItem;
    while (current?.upper_level_task_no && current.upper_level_task_no !== current.task_no) {
      const parent = arr.find(item => item.task_no === current.upper_level_task_no);
      result.push(parent.task_no);
      current = parent;
    }
    current = parent;
    return result;
  }
};
