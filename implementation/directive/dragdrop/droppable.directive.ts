import {
  Directive,
  HostBinding,
  Input,
  Output,
  OnInit,
  NgZone,
  ElementRef,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { Subscription, fromEvent, Subject } from 'rxjs';
import { DragDropService } from './dragdrop.service';
@Directive({
  selector: '[tDroppable]',
})
export class DroppableDirective implements OnInit {
  // @HostBinding('draggable') draggable:Boolean = true;
  @Input() dragData: any;
  @Input() disableDrop: boolean = false;
  /**
   *  用于修正有内嵌列表后，父项高度被撑大，此处height，width为父项自己的高度（用于纵向拖动），宽度（用于横向拖动）
   * */
  @Input() nestingTargetRect: { height?: number; width?: number; marginBottom?: number };
  /**
   * Defines compatible drag drop pairs. Values must match both in draggable and droppable.dropScope.
   */
  @Input() dropScope: string | Array<string> = 'default';
  /**
   * 用于允许拖动到元素上，方便树形结构的拖动可以成为元素的子节点
   */
  @Input() allowDropOnItem = false;
  /**
   * allowDropOnItem为true时，才有效，用于允许拖动到元素上后，被命中的元素增加样式
   */
  @Input() dragOverItemClass: string;
  @Output() dropEvent: EventEmitter<any> = new EventEmitter<any>(); // 注意使用了虚拟滚动后，DropEvent中的dragFromIndex无效


  private dragPartEventSub: Subscription;
  private itemHeight: number;

  constructor(
    protected el: ElementRef,
    private ngZone: NgZone,
    private dragDropService: DragDropService
  ) { }
  ngOnInit() {
    this.itemHeight = this.nestingTargetRect.height + this.nestingTargetRect.marginBottom;
    this.ngZone.runOutsideAngular(() => {
      this.dragPartEventSub = new Subscription();
      this.dragPartEventSub.add(
        fromEvent<DragEvent>(this.el.nativeElement, 'dragover').subscribe((event) =>
          this.dragOver(event)
        )
      );
      this.dragPartEventSub.add(
        fromEvent(this.el.nativeElement, 'dragenter').subscribe((event) => this.dragEnter(event))
      );
      this.dragPartEventSub.add(
        fromEvent(this.el.nativeElement, 'dragleave').subscribe((event) => this.dragLeave(event))
      );
    });
  }
  @HostListener('drop', ['$event'])
  drop(ev) {
    if (!ev?.path?.includes(this.dragDropService.dragElement)) {
      this.dragDropService.toElement = undefined;
      this.dropEvent.emit(this.dragDropService);
      ev.stopPropagation();
    }
    ev.preventDefault();
  }

  allowDrop(ev, type?) {
    let ref = true;
    const currentTarget = ev.toElement; // ev.currentTarget
    if (this.dragDropService.dragElement === currentTarget.parentElement.parentElement) {
      // 判断不是目标对象不是当前拖拽对象
      ref = false;
    } else if (
      (currentTarget.parentElement.parentElement.tagName !== 'LI' &&
        currentTarget.parentElement.parentElement.tagName !== 'UL') ||
      currentTarget.className === 'temp'
    ) {
      ref = false;
    } else if (ev?.path?.includes(this.dragDropService.dragElement)) {
      ref = false;
    } else if (ev.ctrlKey) {
      ref = false;
    } else if (this.disableDrop) {
      ref = false;
    }
    return ref;
  }
  // 当某被拖动的对象在另一对象容器范围内拖动时触发此事件
  dragOver(ev): void {
    const currentTarget = ev.toElement;
    if (this.allowDrop(ev, 'dragOver')) {
      if (ev.toElement.className !== 'topPanel') {
        return;
      }
      const liObj = currentTarget.parentElement.parentElement;
      const layerY = ev.offsetY;
      const height = this.itemHeight;
      /** drop的索引位置 */
      const index = this.findRow(liObj); // Math.floor(layerY/this.itemHeight)-1
      const positionY = layerY % this.itemHeight;
      /** ul标签对象 */
      const element = this.el.nativeElement;
      /** 是否切换层级 */
      const changePanel = element !== this.dragDropService.dragElement.parentElement.parentElement;

      // 判断移动的位置
      if (positionY <= this.nestingTargetRect.height * 0.3) {
        this.dragDropService.positionType = -1;
      } else if (
        positionY > this.nestingTargetRect.height * 0.3 &&
        positionY < this.nestingTargetRect.height * 0.7
      ) {
        this.dragDropService.positionType = 0;
      } else if (positionY >= this.nestingTargetRect.height * 0.7) {
        this.dragDropService.positionType = 1;
      }
      /** 目标索引位置 */
      const spliceIndex = this.dragDropService.positionType !== 1 ? index : index + 1;
      // let spliceIndex = this.dragDropService.positionType === -1 ? index : index + 1

      // 移除所有临时占位DOM
      Array.from(element.getElementsByClassName('temp')).forEach((o: any, i) => {
        o.remove();
      });
      if (this.dragDropService.positionType !== 0) {
        if (changePanel) {
          this.addTemp(ev, spliceIndex);
        } else if (element.children[0].children.length - 1 > spliceIndex) {
          this.addTemp(ev, spliceIndex);
        } else {
          this.el.nativeElement.appendChild(this.dragDropService.tempElement);
        }
      }
      this.dragDropService.dropIndex = spliceIndex;
      ev.stopPropagation();
    } else {
      ev.stopPropagation();
    }
    if (!this.disableDrop) {
      ev.preventDefault();
    }
  }

  // 当被鼠标拖动的对象进入其容器范围内时触发此事件
  dragEnter(ev) {
    if (this.allowDrop(ev)) {
      this.triggerPanelShow(ev);
    } else {
      ev.stopPropagation();
    }
    ev.preventDefault();
  }

  composedPath (e) {
    // 存在则直接return
    if (e.path) { return e.path; }
    // 不存在则遍历target节点
    let target = e.target;
    e.path = [];
    while (target.parentNode !== null) {
      e.path.push(target);
      target = target.parentNode;
    }
    // 最后补上document和window
    e.path.push(document, window);
    return e.path;
  }

  triggerPanelShow(ev) {
    let liDom = undefined;
    let path = ev?.path || (ev?.composedPath && ev?.composedPath());
    path = path || this.composedPath(ev);
    path?.some((o) => {
      if (o.getAttribute && o.getAttribute('drag-item')) {
        liDom = o;
        return true;
      }
    });
    if (liDom) {
      const topPanel = liDom.getElementsByClassName('topPanel')[0];
      Object.assign(topPanel.style, {
        width: '100%',
        height: '100%',
        paddingBottom: this.nestingTargetRect.marginBottom + 'px',
      });
    }
  }
  // 当被鼠标拖动的对象离开其容器范围内时触发此事件
  dragLeave(ev) {
    if (this.allowDrop(ev, 'dragLeave')) {
      // if(this.dragDropService.toElement!=this.dragDropService.prevElement){
      //   Array.from(ev.currentTarget.parentElement.getElementsByClassName('temp')).forEach((o:any) => {
      //     o.remove()
      //   })
      // }
    } else {
      ev.stopPropagation();
    }
    ev.preventDefault();
  }
  addTemp(ev, index) {
    this.el.nativeElement.children[0].insertBefore(
      this.dragDropService.tempElement,
      this.el.nativeElement.children[0].children[index]
    );
  }
  findRow(node) {
    let i = 0;
    while (node.previousSibling) {
      node = node.previousSibling;
      if (node.nodeType === 1 && node.tagName !== 'DIV') {
        i++;
      }
    }
    return i;
  }
}
