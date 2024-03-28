import {
  Component,
  Input,
  Output,
  SimpleChanges,
  EventEmitter,
  OnInit,
  OnChanges,
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DynamicWbsService } from '../../wbs.service';
@Component({
  selector: 'app-wbs-drag',
  templateUrl: 'wbs-drag.component.html',
  styleUrls: ['wbs-drag.component.less'],
})
export class WbsDragComponent implements OnInit, OnChanges {
  @Input() pageDatas: any[] = [];
  @Input() isDragDropEnd: boolean = false;
  @Output() dragDropEnd = new EventEmitter();
  data = [];

  constructor(public wbsService: DynamicWbsService,) {

  }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    this.data = changes.pageDatas?.currentValue;
  }

  drop(event: CdkDragDrop<string[]>) {
    // 补：spring 2.7 PCC整合T100 - 同步WBS管控不可拖拽
    // 一级（整棵树）的拖拽管控
    if (this.isDragDropEnd || !this.wbsService.editable || (this.wbsService.projectInfo?.project_status === '20')) {
      return;
    }
    // 修复：spring 1.8 拖拽功能管控
    // 一级（整棵树）的拖拽管控
    const finder = [];
    if (this.pageDatas && this.pageDatas?.length) {
      const findChildren = this.pageDatas[event.previousIndex];
      this.getTaskChildrenAnyKey(findChildren, 'is_issue_task_card', true, finder);
    }
    if (finder && (finder?.length > 0)) {
      return;
    }
    moveItemInArray(this.data, event.previousIndex, event.currentIndex);
    this.dragDropEnd.emit(event);
  }

  /**
   * 递归方法：查找的父节点的所有子节点中是否有满足条件集合
   * @param children  一组任务信息的集合
   * @param key 查找的节点对象的属性
   * @param value 查找的节点对象的属性值
   * @param finder 查找的父节点的所有子节点
   */
  getTaskChildrenAnyKey(children, key: string, value: any, finder: Array<any>) {
    if (children) {
      if (children[key] === value) {
        finder.push(children.children);
      }
      if (children && children.children && children.children?.length) {
        children.children.forEach(v => {
          this.getTaskChildrenAnyKey(v, key, value, finder);
        });
      }
    }
  }

}
