import { Injectable } from '@angular/core';
import { DynamicWbsService } from '../component/wbs/wbs.service';

@Injectable({
  providedIn: 'root'
})
export class WbsBusinessService {
  // 不可拖拽得树父级id
  parentIdList: any = [];
  // 甬道内的所有子卡，方便把嵌套结构转化为平铺计算一级卡片的状态
  corridorChildrens: Array<any>;

  constructor(public wbsService: DynamicWbsService,) { }

  /**
   * 对所有任务卡进行分类
   * @returns 分类后的任务卡数组
   */
  classifyTaskCards(list: any[]): any[] {
    const record = {};
    const data = [];
    // 按照任务编号排序生成record对象
    list.forEach((listItem: any): void => {
      listItem.disabled = this.wbsService.editable ? true : false;
      // 任务状态
      listItem.task_status = Number(listItem.task_status);
      // 完成率
      listItem.complete_rate_gatter = listItem.complete_rate;
      // 容错外面已经处理过
      if (listItem.complete_rate <= 1) {
        listItem.complete_rate = Math.floor(listItem.complete_rate * 100);
      }
      // 默认展开所有节点
      listItem.isChildrenshow = true;
      // 默认收起操作列表
      listItem.isOperationsShow = false;
      // 子任务
      listItem.children = [];
      // listItem.switch = false;
      // listItem.innerSwitch = false;
      // 顺序：由前端记录任务新增的顺序
      if (listItem.sequence) {
        listItem.sequence = Number(listItem.sequence);
      }
      record[listItem.task_no] = listItem;
    });
    // 根据生成的record对象进行生成tree格式结构数据
    list.forEach((item: any): void => {
      // 	上阶任务编号
      if (
        item.upper_level_task_no &&
        record[item.upper_level_task_no] &&
        item.upper_level_task_no !== item.task_no
      ) {
        record[item.upper_level_task_no].children.push(item);
      } else {
        data.push(item);
      }
      // 是否已发任务卡	true：是 false：否
      if (item.is_issue_task_card) {
        const parentId = this.wbsService.parentId(this.wbsService.allTaskCardList, item.task_no);
        this.parentIdList.push(parentId);
      }
    });
    this.parentIdList = Array.from(new Set(this.parentIdList));
    if (this.wbsService.isTrackPages) {
      this.statusHandle(data);
    }
    this.wbsService.cardLevelHandle(data, 0);
    this.filterBySequence(data);
    this.wbsService.calculationChildrenLength(data);
    // 设置是否可拖拽disbale属性
    this.setDropDisable(data);
    return data;
  }

  statusHandle(data: any): void {
    data.forEach((item: any): void => {
      this.corridorChildrens = [];
      const childrens = this.treeToArray(item.children);
      // 10: 未开始, 20: 进行中, 30: 已完成
      item.status =
        childrens.length > 0
          ? childrens.every((childrensItem) => childrensItem.task_status === 30)
            ? 30
            : childrens.every((childrensItem) => childrensItem.task_status === 10)
              ? 10
              : 20
          : item.task_status;
      // 有子卡，进行中要判断是否有逾期或者异常
      if (item.status === 10 || item.status === 20 || item.status === 30) {
        childrens.forEach((child) => {
          item.isOverdue = this.wbsService.overdueDays(child) ? true : false;
        });
        this.isOverdue(item);
      }
      // 无子卡，根据自身逾期情况判断
      if (childrens?.length === 0) {
        item.isOverdue = this.wbsService.overdueDays(item) ? true : false;
      }
    });
  }

  filterBySequence(data: any): void {
    data.sort(this.sortBySequence);
    data.forEach((item: any, index: any): void => {
      if (item.children?.length) {
        this.filterBySequence(item.children);
      }
    });
  }

  sortBySequence(a, b): any {
    return a.sequence - b.sequence;
  }

  /**
  * 数据平铺， 判断甬道内的第一张卡片的状态
  * @param children 甬道内的第一个children
  * @returns
  */
  treeToArray(children): any {
    children.map((item): void => {
      this.corridorChildrens = this.corridorChildrens.concat(item);
      if (item.children?.length) {
        this.treeToArray(item.children);
      }
    });
    return this.corridorChildrens;
  }


  setDropDisable(data): void {
    data.forEach((res: any): void => {
      this.parentIdList.forEach((item: any): void => {
        if (res.task_no === item) {
          res.disabled = true;
          if (res.children?.length) {
            this.addCardStatus(res);
          }
        }
      });
    });
  }

  /**
  * 进行中时判断当前卡片是否逾期&&根据子卡判断上层父卡的状态
  * @param children
  */
  isOverdue(item): void {
    item.children.forEach((child): void => {
      if (child.task_status === 10 || child.task_status === 20 || child.task_status === 30) {
        if (this.wbsService.overdueDays(child)) {
          child.isOverdue = true;
          item.isOverdue = true;
        }
        if (child.children?.length) {
          this.isOverdue(child);
        }
      }
    });
  }

  addCardStatus(current: any): void {
    current.children.forEach((item: any): void => {
      item.disabled = true;
      if (item.children?.length) {
        this.addCardStatus(item);
      }
    });
  }

}
