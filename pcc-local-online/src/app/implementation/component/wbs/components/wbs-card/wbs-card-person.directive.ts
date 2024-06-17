import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Directive({
  selector: '[appCardPersonDisplay]',
})
export class CardPersonDisplayDirective implements AfterViewInit {
  constructor(private el: ElementRef, private translateService: TranslateService) {}
  ngAfterViewInit() {
    const innerText = this.el.nativeElement.innerText;
    const rec = this.el.nativeElement.getBoundingClientRect();
    this.setEllipsis(innerText, rec);
  }

  setEllipsis(innerText, rec) {
    if (innerText && rec.width === 0) {
      window.requestAnimationFrame(() => {
        this.setEllipsis(innerText, rec);
      });
      return;
    }
    if (this.isEllipsis(innerText, rec.width)) {
      this.el.nativeElement.classList.add('is-ellipsis');
      const s1 = document.createElement('span');
      const s2 = document.createElement('span');
      this.el.nativeElement.innerHTML = '';
      s1.innerText = innerText;
      this.el.nativeElement.style.display = 'flex';
      s1.style.cssText = 'flex: 1;overflow: hidden;white-space: nowrap;';
      // s2.style.cssText = 'flex: 1';
      s2.innerText = `...${this.translateService.instant('dj-pcc-共n人', {
        n: innerText.split('、').length,
      })}`;
      this.el.nativeElement.append(s1, s2);
    }
  }
  /**
   * 检测文本是否溢出
   * 参考 https://github.com/ElemeFE/element/blob/dev/packages/table/src/table-body.js#L241
   * @param {*} e
   * @returns
   */
  isEllipsis(value, referenceValues) {
    const s = document.createElement('span');
    s.innerText = value;
    s.style.position = 'absolute';
    s.style.bottom = '-99999px';
    document.body.appendChild(s);
    const rec = s.getBoundingClientRect();
    if (referenceValues >= rec.width) {
      document.body.removeChild(s);
      return false;
    }
    document.body.removeChild(s);
    return true;
  }
}
