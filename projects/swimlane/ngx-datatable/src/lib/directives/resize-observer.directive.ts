import { Directive, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';

/**
 * ResizeObserverDirective is used to detect element resizes independent from a window resize event
 */

@Directive({
  selector: '[resizeObserver]'
})
export class ResizeObserverDirective implements OnDestroy {
  @Output() resize: EventEmitter<ResizeObserverEntry> = new EventEmitter();

  @Input() set resizeObserverEnabled(val: boolean) {
    this._enabled = val;
    if (val) {
      this.attach();
    } else {
      this.detach();
    }
  }
  get enabled(): boolean {
    return this._enabled;
  }

  private resizeElement: Element;
  private resizeObserver: ResizeObserver;

  private _enabled: boolean = false;

  constructor(element: ElementRef) {
    this.resizeElement = element.nativeElement;
    this.createResizeObserver();
  }

  ngOnDestroy(): void {
    this.detach();
    this.resizeObserver?.disconnect();
  }

  private attach() {
    this.resizeObserver?.observe(this.resizeElement);
  }

  private detach() {
    this.resizeObserver?.unobserve(this.resizeElement);
  }

  private async createResizeObserver() {
    if ('ResizeObserver' in window === false) {
      // Loads polyfill asynchronously, only if required.
      const module = await import('@juggle/resize-observer');
      (window as any).ResizeObserver = module.ResizeObserver;
    }

    this.resizeObserver = new ResizeObserver((entries, observer) => {
      for (const entry of entries) {
        if (entry.target === this.resizeElement) {
          this.resize.emit(entry);
          break;
        }
      }
    });
  }
}
