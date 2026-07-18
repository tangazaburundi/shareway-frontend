import { Directive, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';

declare const lucide: {
  createIcons: (config?: { attrs?: Record<string, string>; nameAttr?: string }) => void;
};

@Directive({ selector: '[lucideIcons]', standalone: true })
export class LucideIconsDirective implements AfterViewInit, OnDestroy {
  private observer: MutationObserver | null = null;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.initIcons();
    this.observer = new MutationObserver(() => this.initIcons());
    this.observer.observe(this.el.nativeElement, { childList: true, subtree: true });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  private initIcons() {
    try {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    } catch {}
  }
}
