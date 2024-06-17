import {
  Directive,
  HostBinding,
  Input,
  OnInit,
  NgZone,
  ElementRef,
  SimpleChanges,
  OnChanges,
  TemplateRef,
  ViewContainerRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import {
  Subscription,
  fromEvent,
  Subject,
  Observable,
  Observer,
  animationFrameScheduler,
} from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty, isNotEmpty } from '@athena/dynamic-core';
import {
  auditTime,
  debounceTime,
  filter,
  map,
  pairwise,
  pluck,
  takeUntil,
  tap,
} from 'rxjs/operators';

@Directive({
  selector: '[pccScrollbar]',
})
export class CustPccScrollbarDirective implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  scrollAuditTime = 0;
  /** Stream that emits on scroll event */
  scrolled!: Observable<any>;
  /** Steam that emits scroll event for vertical scrollbar */
  verticalScrolled!: Observable<any>;
  /** Steam that emits scroll event for horizontal scrollbar */
  horizontalScrolled!: Observable<any>;
  private readonly destroyed = new Subject<void>();
  private _currentSubscription: Subscription | null = null;
  private _resizeObserver!: ResizeObserver;
  debounce = 0;
  private scrollX$: HTMLElement;
  private scrollY$: HTMLElement;
  constructor(
    public el: ElementRef,
    private zone: NgZone,
    private translateService: TranslateService,
    private messageService: NzMessageService
  ) {}
  ngOnInit() {
    this.el.nativeElement.style.overflow = 'hidden';
    this.createXYScrollBar();
    this.bindScrollEvent();
  }
  ngAfterViewInit() {
    if (!this._currentSubscription) {
      this._resizeSubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges) {}
  ngOnDestroy() {
    this._unsubscribe();
  }
  createXYScrollBar() {
    const scrollX = document.createElement('div');
    scrollX.classList.add('pcc-scroll-x');
    scrollX.style.cssText = `
    width: ${900}px; 
    height: 6px; background: red; 
    position: absolute; 
    bottom: 0px; 
    left: 0px; 
    z-index: 9999999`;
    const scrollY = document.createElement('div');
    scrollY.classList.add('pcc-scroll-x');
    const temp = document.createDocumentFragment();
    temp.appendChild(scrollX);
    temp.appendChild(scrollY);
    this.el.nativeElement.appendChild(temp);
    this.scrollX$ = scrollX;
    this.scrollY$ = scrollY;
  }
  bindScrollEvent() {
    this.zone.runOutsideAngular(() => {
      let scrollStream = fromEvent(this.el!.nativeElement, 'scroll', { passive: true });
      // Throttle scroll event if 'scrollAuditTime' is set
      scrollStream = this.scrollAuditTime
        ? scrollStream.pipe(auditTime(this.scrollAuditTime))
        : scrollStream;
      // Initialize scroll streams
      this.scrolled = scrollStream.pipe(takeUntil(this.destroyed));
      this.verticalScrolled = this.getScrolledByDirection('scrollTop');
      this.horizontalScrolled = this.getScrolledByDirection('scrollLeft');
      this.horizontalScrolled.subscribe((e) => {
        console.log(e, 'e');
      });
    });
  }
  resizedEventHandler(e) {
    animationFrameScheduler.schedule(() => this.updateStyle(e));
  }
  private updateStyle(e) {
    console.log(e, 'eee');
    const info = e[0];
    console.log(info.target.scrollWidth, 'info.target.scrollWidth');
    console.log(info.contentRect.width, 'info.contentRect.width');
    const scrollWidth = info.target.scrollWidth;
    const clientWidth = info.target.clientWidth;
    this.scrollX$.style.width = (clientWidth * clientWidth) / scrollWidth + 'px';
  }
  private getScrolledByDirection(property: 'scrollLeft' | 'scrollTop') {
    let event: any;
    return this.scrolled!.pipe(
      tap((e: any) => (event = e)),
      pluck('target', property),
      pairwise(),
      filter(([prev, curr]) => prev !== curr),
      map(() => event)
    );
  }
  private _resizeSubscribe() {
    this._unsubscribe();
    const stream = new Observable((observer: Observer<ReadonlyArray<ResizeObserverEntry>>) => {
      this._resizeObserver = new ResizeObserver((e: ReadonlyArray<ResizeObserverEntry>) =>
        observer.next(e)
      );
      this._resizeObserver.observe(this.el.nativeElement);
    });

    this.zone.runOutsideAngular(() => {
      this._currentSubscription = (
        this.debounce ? stream.pipe(debounceTime(this.debounce)) : stream
      ).subscribe(this.resizedEventHandler.bind(this));
    });
  }

  private _unsubscribe() {
    this.destroyed.next();
    this.destroyed.complete();
    this._resizeObserver?.disconnect();
    this._currentSubscription?.unsubscribe();
  }
}
