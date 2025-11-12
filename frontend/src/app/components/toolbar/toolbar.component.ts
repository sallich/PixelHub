import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasStateService } from '../../core/services/canvas-state.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  private readonly canvasState = inject(CanvasStateService);

  readonly palette = this.canvasState.palette;
  readonly selectedColor = computed(() => this.canvasState.selectedColor());

  selectColor(index: number): void {
    this.canvasState.setSelectedColor(index);
  }
}


