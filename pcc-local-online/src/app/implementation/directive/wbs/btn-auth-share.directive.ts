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
} from '@angular/core';
import { Subscription, fromEvent, Subject } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty, isNotEmpty } from '@athena/dynamic-core';

@Directive({
  selector: '[custAuthBtnByShare]',
})
export class CustAuthBtnByShareDirective implements OnInit, OnChanges {
  @Input('custAuthBtnByShare') sameUser: any;
  constructor(
    private translateService: TranslateService,
    private messageService: NzMessageService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}
  hasView = false;
  ngOnInit() {
    this.createView();
  }
  ngOnChanges(changes: SimpleChanges) {
    this.createView();
  }
  createView() {
    if (this.getAuth(this.sameUser)) {
      if (!this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }
    } else {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
  public getAuth(sameUser?: any) {
    sameUser = isNotEmpty(sameUser) ? sameUser : this.sameUser;
    if (!sameUser) {
      return false;
    }
    return true;
  }
}
