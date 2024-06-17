/**
 * 过滤表单项
 * 基本信息分组使用
 */
import { Directive, ElementRef, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appFilterFormItem]',
})
export class PccFilterFormItemDirective {
  private hasView = false;
  constructor(
    private el: ElementRef,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {
    // el.nativeElement.parentNode.removeChild(el.nativeElement);
  }
  @Input() set appFilterFormItem(info: boolean) {
    const formItemKey = info[0],
      formItemKeys = info[1] || [],
      condition = formItemKeys.includes(formItemKey);
    if (condition && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
