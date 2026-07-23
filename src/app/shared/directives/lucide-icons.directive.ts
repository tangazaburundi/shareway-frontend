import { Directive, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';

declare const lucide: {
  createIcons: (config?: { attrs?: Record<string, string>; nameAttr?: string }) => void;
};

@Directive({ selector: '[lucideIcons]', standalone: true })
export class LucideIconsDirective implements AfterViewInit, OnDestroy {
  private observer: MutationObserver | null = null;
  private debounceTimer: any = null;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.initIcons();
    this.observer = new MutationObserver(() => this.debouncedInit());
    this.observer.observe(this.el.nativeElement, { childList: true, subtree: true });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    clearTimeout(this.debounceTimer);
  }

  private debouncedInit() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.initIcons(), 50);
  }

  private initIcons() {
    if (this.observer) {
      this.observer.disconnect();
    }
    try {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    } catch {}
    if (this.observer) {
      this.observer.observe(this.el.nativeElement, { childList: true, subtree: true });
    }
  }
}
