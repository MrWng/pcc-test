import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, shareReplay, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PccResizeService implements OnDestroy {
  private _destroyed = new Subject<void>();
  private _resizeSubject = new Subject<ResizeObserverEntry[]>();
  private _resizeObserver?: ResizeObserver;
  private _elementObservables = new Map<Element, Observable<ResizeObserverEntry[]>>();

  constructor() {
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver((entries) => this._resizeSubject.next(entries));
    }
  }
  ngOnDestroy() {
    this.destroy();
  }
  observe(target: Element, options?: ResizeObserverOptions): Observable<ResizeObserverEntry[]> {
    if (!this._elementObservables.has(target)) {
      const box = options?.box || 'content-box';
      this._elementObservables.set(
        target,
        new Observable<ResizeObserverEntry[]>((observer) => {
          const subscription = this._resizeSubject.subscribe(observer);
          this._resizeObserver?.observe(target, { box: box });
          return () => {
            this._resizeObserver?.unobserve(target);
            subscription.unsubscribe();
            this._elementObservables.delete(target);
          };
        }).pipe(
          filter((entries) => entries.some((entry) => entry.target === target)),
          shareReplay({ bufferSize: 1, refCount: true }),
          takeUntil(this._destroyed)
        )
      );
    }
    return this._elementObservables.get(target)!;
  }
  destroy() {
    this._destroyed.next();
    this._destroyed.complete();
    this._resizeSubject.complete();
    this._elementObservables.clear();
  }
}
