export class Scroll {
  static _map: Map<Element, Scroll> = new Map();
  static el: Element;
  constructor(el: Element) {
    Scroll.el = el;
    Scroll._map.set(Scroll.el, this);
  }

  static getScrollInstance(el: Element, needReCreate = false) {
    if (Scroll._map.has(el) && !needReCreate) {
      return Scroll._map.get(el);
    }
    return new Scroll(el);
  }

  getElement(): Element {
    return Scroll.el;
  }

  getScrollHeight(): number {
    return Scroll.el.scrollHeight;
  }

  getScrollWidth(): number {
    return Scroll.el.scrollWidth;
  }

  scrollTo(x: number, y: number): void {
    Scroll.el.scrollTo(x, y);
  }

  scrollTop(y: number): void {
    Scroll.el.scrollTop = y;
  }

  scrollLeft(x: number): void {
    Scroll.el.scrollTop = x;
  }
  static destroy() {
    Scroll.el = null;
    Scroll._map.clear();
  }
}
