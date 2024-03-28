import { Inject, Injectable } from '@angular/core';
import { DwLanguageService } from '@webdpt/framework/language';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { Subject } from 'rxjs';
import { HttpRequest } from '@angular/common/http';
import * as moment from 'moment';
import { DragDropService } from '../../../directive/dragdrop/dragdrop.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonService, Entry } from '../../../service/common.service';

@Injectable()
export class CooperationTaskService {
  atmcUrl: string;
  smartDataUrl: string;
  eocUrl: string;
  aimUrl: string;
  group: any;
  taskDetail: any;
  // 页面转化成树形结构的数据，方便各个组件取用
  pageDatas: Array<any>;

  $newCardInfo = new Subject();

  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    private configService: DwSystemConfigService,
    private languageService: DwLanguageService,
    protected commonService: CommonService,
    private messageService: NzMessageService
  ) {
    this.configService.get('atmcUrl').subscribe((url: string) => {
      this.atmcUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
    this.configService.get('eocUrl').subscribe((url: string): void => {
      this.eocUrl = url;
    });
    this.configService.get('aimUrl').subscribe((url: string): void => {
      this.aimUrl = url;
    });
  }

  intercept(req: HttpRequest<any>): HttpRequest<any> {
    if (this.languageService && this.languageService.currentLanguage) {
      req = req.clone({
        setHeaders: {
          locale: this.languageService.currentLanguage,
        },
      });
    }
    if (this.authToken?.token) {
      // 如果有token，就添加
      req = req.clone({
        setHeaders: {
          'digi-middleware-auth-user': this.authToken.token, // '7547173d-9ea9-4651-a6f4-f6897c20af3b',
          token: this.authToken.token, // '7547173d-9ea9-4651-a6f4-f6897c20af3b'
        },
      });
    }
    req = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
      },
    });
    return req;
  }

  /*
   * 获取项目周期（开始时间-截止时间）
   * @param startT:项目开始时间
   * @param endT:项目截止时间
   * @return 项目周期
   */
  getPjPeriod(startT: string, endT: string): string {
    try {
      if (startT && endT) {
        const startDate = new Date(startT),
          endDate = new Date(endT),
          start = `${startDate.getFullYear()}.${(startDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}.${startDate.getDate().toString().padStart(2, '0')}`,
          endYear =
            startDate.getFullYear() === endDate.getFullYear() ? '' : `${endDate.getFullYear()}.`,
          end = `${endYear}${(endDate.getMonth() + 1).toString().padStart(2, '0')}.${endDate
            .getDate()
            .toString()
            .padStart(2, '0')}`;
        return `${start}-${end}`;
      }
    } catch (err) {
      return `xxxx.xx.xx-xx.xx`;
    }
  }

  /**
   * 工期计算
   * @param item 卡片信息
   * @returns 工期
   */
  durationCalculation(item): number {
    let diff = 0;
    if (item.plan_finish_date && item.plan_start_date) {
      diff = moment(item.plan_finish_date).diff(moment(item.plan_start_date), 'days') + 1;
    }

    return diff;
  }

  /**
   * 逾期计算
   * @param item 卡片信息
   * @returns 工时
   */

  overdueDays(item): boolean {
    let startDiff, finishDiff;
    if (item.task_status === 20 || item.task_status === 10 || item.task_status === 30) {
      const actualFinishDate = item.actual_finish_date ? item.actual_finish_date : moment(new Date()).format('YYYY-MM-DD');
      const actualStartDate = item.actual_start_date ? item.actual_start_date : moment(new Date()).format('YYYY-MM-DD');
      startDiff = moment(actualStartDate).diff(moment(item.plan_start_date), 'days');
      finishDiff = moment(actualFinishDate).diff(moment(item.plan_finish_date), 'days');
    }
    if (startDiff > 0) {
      return startDiff;
    }
    if (finishDiff > 0) {
      return finishDiff;
    }
  }

  getChildrenLength(datas, item): number {
    let length = 0;
    const expanded = (data, isChildrenshow) => {
      if (isChildrenshow && data && data.length > 0) {
        length += data.length;
        data.forEach((e) => {
          expanded(e.children, e.isChildrenshow);
        });
      }
    };
    expanded(datas, item.isChildrenshow);
    return length;
  }

  /**
   *
   * @param data 计算子卡的数量，方便计算连线高度
   */
  calculationChildrenLength(data) {
    data.forEach((item) => {
      if (item.children && item.children.length) {
        if (item.children.length > 1) {
          item.chilrenLength =
            this.getChildrenLength(item.children.slice(0, item.children.length - 1), item) + 1;
        } else {
          item.chilrenLength = item.children.length;
        }

        this.calculationChildrenLength(item.children);
      }
    });
  }

  /**
   *
   * @param data 卡片层级，方便计算卡片宽度
   * @param level
   */
  cardLevelHandle(data: Array<any>, level: number) {
    data.forEach((item) => {
      if (item.children) {
        this.cardLevelHandle(item.children, level + 1);
        item.level = level;
      }
    });
  }

  /**
   *
   * @param cardList 点击新增时寻找当前甬道
   * @param card
   * @returns
   */
  findFirstParentCard(cardList, card): boolean {
    let isFind = false;
    for (let i = 0; i < cardList.length; i++) {
      const item = cardList[i];
      if (item.task_no === card.task_no) {
        isFind = true;
        break;
      }
      if (!isFind && item.children && item.children.length) {
        isFind = this.findFirstParentCard(item.children, card);
      }
    }

    return isFind;
  }

  /**
   *
   * @param e 拖拽时
   * @param target
   * @param index
   */
  onDrop(e: DragDropService, target, fun, source: any, index?): void {
    const item = e.dragData.item;
    const parent = e.dragData.parentList;
    const indexOfParent = e.dragData.index;
    const positionType = e.positionType; //
    /** drop的位置在列表的index */
    const dropIndex = e.dropIndex;
    /** drag元素在原来的列表的index，注意使用虚拟滚动数据无效 */
    const fromIndex = e.dragFromIndex;
    const changeList = target.children !== parent;
    if (target.children === parent && dropIndex > fromIndex) {
      index--;
    }
    const fromList = parent.map((o: any): any => {
      return o;
    });
    let task_no, toList;
    if (index !== undefined) {
      task_no = target.task_no;
      toList = target.children;
    } else {
      task_no = e.positionType === 0 ? target.children[dropIndex].task_no : target.task_no;
      toList = target.children[dropIndex].children;
    }
    toList = (toList || []).map((o: any): any => {
      return o;
    });
    this.buildList(fromList, toList, indexOfParent, index, task_no);
    const task_info = [...fromList, ...toList];
    // 源数组移除
    this.commonService.getInvData('task.base.info.update', {
      task_info: task_info.map((o) => {
        o.is_update_upper_date = 'Y';
        o.task_property = source === Entry.maintain ? '2' : '1';
        o.doc_type_info = o.doc_condition_value.split(',').map(
          (i) => {
            return { doc_condition_value: i };
          }
        );
        return o;
      }),
    }).subscribe((res) => {
      if (res.data.task_info[0]?.project_no_mistake_message) {
        this.messageService.error(res.data.task_info[0]?.project_no_mistake_message);
        return;
      }
      // 删除源数据列表数据并对数组进行重新编号
      parent.splice(indexOfParent, 1).forEach((o, i): void => {
        o.sequence = i + 1;
      });
      // 插入
      if (e.positionType === 0) {
        if (index !== undefined) {
          target.children = target.children || [];
          target.children.push(Object.assign(item, { upper_level_task_no: target.task_no }));
        } else {
          target.children[dropIndex].children = target.children[dropIndex].children || [];
          target.children[dropIndex].children.push(
            Object.assign(item, { upper_level_task_no: target.task_no })
          );
        }
      } else {
        target.children
          .splice(dropIndex, 0, Object.assign(item, { upper_level_task_no: target.task_no }))
          .forEach((o, i): void => {
            o.sequence = i + 1;
          });
      }
      if (item.level === 0) {
        this.pageDatas.forEach((currentData: any, index: number): void => {
          if (currentData.task_no === item.task_no) {
            this.pageDatas.splice(index, 1);
          }
        });
      }
      this.cardLevelHandle(this.pageDatas, 0);
      this.calculationChildrenLength(this.pageDatas);
      fun();
    });
  }
  buildList(
    fromList: Array<any>,
    toList: Array<any>,
    fromIndex: number,
    toIndex: number,
    parentNo: string
  ): void {
    const item = fromList.splice(fromIndex, 1);
    fromList.forEach((o, i): void => {
      o.sequence = i + 1;
    });
    toList.splice(toIndex || 0, 0, Object.assign({}, item[0], { upper_level_task_no: parentNo }));
  }

  /**
* 获取项目类型编号
*/
  async getProjectInfo(project_no: any): Promise<any> {
    const project_info = [
      {
        project_no: project_no,
      },
    ];
    return await new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('bm.pisc.project.get', {
          project_info,
        })
        .subscribe((res): void => {
          resolve(res.data.project_info[0]);
        });
    });
  }

}
