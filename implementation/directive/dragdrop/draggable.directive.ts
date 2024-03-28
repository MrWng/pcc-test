import { Directive, HostBinding, Input, OnInit, NgZone, ElementRef, Output, EventEmitter } from '@angular/core';
import { Subscription, fromEvent, Subject } from 'rxjs';
import { DragDropService } from './dragdrop.service';
@Directive({
  selector: '[tDraggable]',
})
export class DraggableDirective implements OnInit {
  // @HostBinding('draggable') draggable:boolean = true;
  dragsSub: Subscription = new Subscription();
  @Input() dragData: any;
  @Input() nestingTargetRect: any;
  @Output() dropStartEvent: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    public el: ElementRef,
    private ngZone: NgZone,
    private dragDropService: DragDropService
  ) {}
  ngOnInit(): void {
    const firstChild = this.el.nativeElement.children[0];
    firstChild.setAttribute('title', this.dragData.item.task_no);
    firstChild.setAttribute('drag-item', true);
    this.ngZone.runOutsideAngular((): void => {
      this.dragsSub.add(
        fromEvent(this.el.nativeElement, 'dragstart').subscribe((event) => this.dragStart(event))
      );
      this.dragsSub.add(
        fromEvent(this.el.nativeElement, 'dragend').subscribe((event) => this.dragEnd(event))
      );
    });
    firstChild.style.marginBottom = this.nestingTargetRect.marginBottom + 'px';

    const newEl = document.createElement('div');
    newEl.className = 'topPanel';
    Object.assign(newEl.style, {
      // backgroundColor: 'black',
      position: 'absolute',
      left: '0',
      top: '0',
      boxSizing: 'content-box',
      zIndex: 10000,
    });
    firstChild.appendChild(newEl);
  }
  dragStart(ev): void {
    const index = this.dragData.index;
    this.dragDropService.dragFromIndex = index;
    this.dragDropService.dragData = this.dragData;
    this.dragDropService.dragElement = this.el.nativeElement;
    this.el.nativeElement.style.opacity = '0.1';
    const newEl = document.createElement('div');
    this.dragDropService.tempElement = newEl;
    newEl.style.height = `${this.dragDropService.dragElement.clientHeight}px`;
    newEl.style.border = '1px dashed silver';
    newEl.className = 'temp';
    newEl.style.marginBottom = this.nestingTargetRect.marginBottom + 'px';
    this.dropStartEvent.emit();
    ev.stopPropagation();
  }
  dragEnd(ev): void {
    Array.from(document.getElementsByClassName('temp')).forEach((o) => {
      o.remove();
    });
    Array.from(document.getElementsByClassName('topPanel')).forEach((o: any) => {
      Object.assign(o.style, {
        width: '0',
        height: '0',
        paddingBottom: '0',
      });
    });
    this.el.nativeElement.style.opacity = '1';
    ev.stopPropagation();
  }
}
