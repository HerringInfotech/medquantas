import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[tableColumn]'
})
export class ResizableColumnDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) { }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    const initialX = event.clientX;
    const initialWidth = this.el.nativeElement.offsetWidth;
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'pointer');

    const onMouseMove = (moveEvent: MouseEvent): void => {
      const width = initialWidth + moveEvent.clientX - initialX;
      this.renderer.setStyle(this.el.nativeElement, 'width', `${width}px`);
    };

    const onMouseUp = (): void => {
      this.renderer.removeStyle(this.el.nativeElement, 'cursor');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
}