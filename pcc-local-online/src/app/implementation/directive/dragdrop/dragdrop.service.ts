import { Injectable } from '@angular/core';
class DragDropModel {
  /** 拖动节点的数据 */
  public dragData: any;
  public scope: any;
  /** 拖拽的DOM对象 */
  public dragElement: any;
  // 目标Dom
  public toElement: any;
  /** 上一次的目标对象 */
  public prevElement: any;
  /** 占位Div */
  public tempElement: any;
  // drop的位置在列表的index
  public dropIndex: number;
  public dragFromIndex: number;
  /** -1: 移动到当前节点前; 0：移动到当前子节点; 1：移动到当前节点后 */
  public positionType: number;
}
@Injectable({
  providedIn: 'root',
})
export class DragDropService extends DragDropModel {
  constructor() {
    super();
  }
}
