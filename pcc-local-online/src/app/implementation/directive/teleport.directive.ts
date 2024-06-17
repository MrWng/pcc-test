import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appTeleport]'
})
export class TeleportDirective {

  constructor(private el: ElementRef) {
    document.querySelector('body').appendChild(this.el.nativeElement);
  }
}
