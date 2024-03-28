import { Directive, HostBinding, Input, OnInit, NgZone, ElementRef } from '@angular/core';
import { Subscription, fromEvent, Subject } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';

@Directive({
  selector: '[dCanvas]',
})
export class CanvasDirective implements OnInit {
  // @HostBinding('draggable') draggable:boolean = true;
  @Input() dragData: any;
  @Input() nestingTargetRect: any;
  dragsSub: Subscription = new Subscription();
  private mDown: boolean = false;
  private isMsg: boolean = false;

  constructor(
    public el: ElementRef,
    private ngZone: NgZone,
    private translateService: TranslateService,
    private messageService: NzMessageService
  ) {}

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      this.dragsSub.add(
        fromEvent(this.el.nativeElement, 'mousemove').subscribe((event) => this.mousemove(event))
      );
      this.dragsSub.add(
        fromEvent(this.el.nativeElement, 'mousedown').subscribe((event) => this.mousedown(event))
      );
      this.dragsSub.add(
        fromEvent(this.el.nativeElement, 'scroll').subscribe((event) => this.scroll(event))
      );
      this.dragsSub.add(
        fromEvent(this.el.nativeElement, 'mouseup').subscribe((event) => this.mouseup(event))
      );
      this.dragsSub.add(
        fromEvent(this.el.nativeElement, 'mouseleave').subscribe((event) => this.mouseup(event))
      );
    });
    const newEl = document.createElement('div');
    newEl.className = 'canvasPanel';
    Object.assign(newEl.style, {
      // backgroundColor:'black',
      position: 'absolute',
      left: '0',
      top: '0',
      boxSizing: 'content-box',
    });
    this.el.nativeElement.style.position = 'relative';
    this.el.nativeElement.appendChild(newEl);
  }
  scroll(ev) {
    if (!this.isMsg) {
      this.isMsg = true;
      this.messageService.success(this.translateService.instant('dj-default-按住Ctrl键拖拽提示'));
    }
  }
  mousemove(ev) {
    if (ev.ctrlKey) {
      // this.draggable = false
      ev.currentTarget.style.cursor = 'grab';
      if (this.mDown) {
        ev.currentTarget.scrollTop = ev.currentTarget.scrollTop - ev.movementY;
        ev.currentTarget.scrollLeft = ev.currentTarget.scrollLeft - ev.movementX;
      }
    } else {
      // this.draggable = true
      ev.currentTarget.style.cursor = 'default';
    }
  }
  mousedown(ev) {
    if (ev.ctrlKey) {
      this.mDown = true;
      Array.from(ev.currentTarget.getElementsByClassName('canvasPanel')).forEach((o: any) => {
        Object.assign(o.style, {
          height: '100%',
          width: '100%',
          cursor: 'grabbing',
        });
      });
      ev.preventDefault();
    }
  }
  mouseup(ev) {
    this.mDown = false;
    Object.assign(ev.currentTarget.getElementsByClassName('canvasPanel')[0].style, {
      height: '0',
      width: '0',
    });
  }
}
