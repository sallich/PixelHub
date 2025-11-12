import { Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasStateService } from '../../core/services/canvas-state.service';
import { CooldownService } from '../../core/services/cooldown.service';
import { PixelPlacementService } from '../../core/services/pixel-placement.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  private readonly canvasState = inject(CanvasStateService);
  private readonly cooldownService = inject(CooldownService);
  private readonly placementService = inject(PixelPlacementService);

  @Output() openSettings = new EventEmitter<void>();

  readonly palette = this.canvasState.palette;
  readonly selectedColor = computed(() => this.canvasState.selectedColor());
  readonly placingEnabled = computed(() => this.placementService.placingEnabled());
  readonly cooldownLabel = computed(() => {
    const remaining = this.cooldownService.remainingSeconds();
    return remaining > 0 ? `${remaining}s` : 'ready';
  });
  readonly cooldownActive = computed(() => this.cooldownService.isActive());

  selectColor(index: number): void {
    this.canvasState.setSelectedColor(index);
  }

  togglePlacement(): void {
    this.placementService.togglePlacement();
  }

  onOpenSettings(): void {
    this.openSettings.emit();
  }
}


