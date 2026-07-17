import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({ selector: 'app-modal', standalone: true, imports: [CommonModule],
  templateUrl: './modal.component.html', styleUrls: ['./modal.component.css'] })
export class ModalComponent {
  @Input() open = false; @Input() title = ''; @Input() size: 'sm'|'md'|'lg' = 'md';
  @Output() close = new EventEmitter<void>();
}