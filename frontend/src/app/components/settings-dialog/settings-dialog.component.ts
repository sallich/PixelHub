import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../core/services/config.service';
import { AppConfig } from '../../core/models/app-config.model';

export interface SettingsResult {
  baseChanged: boolean;
  config: AppConfig;
}

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss'
})
export class SettingsDialogComponent {
  private readonly configService = inject(ConfigService);

  @ViewChild('dialog', { static: true }) dialogRef!: ElementRef<HTMLDialogElement>;
  @Output() settingsSaved = new EventEmitter<SettingsResult>();

  readonly formModel = signal({
    apiBase: '',
    canvasWidth: 0,
    canvasHeight: 0,
    rateLimitSeconds: 0
  });

  updateApiBase(value: string): void {
    this.formModel.update((state) => ({ ...state, apiBase: value }));
  }

  updateCanvasWidth(value: string): void {
    const parsed = Number(value);
    this.formModel.update((state) => ({ ...state, canvasWidth: parsed }));
  }

  updateCanvasHeight(value: string): void {
    const parsed = Number(value);
    this.formModel.update((state) => ({ ...state, canvasHeight: parsed }));
  }

  updateRateLimit(value: string): void {
    const parsed = Number(value);
    this.formModel.update((state) => ({ ...state, rateLimitSeconds: parsed }));
  }

  open(): void {
    const config = this.configService.config();
    this.formModel.set({
      apiBase: config.apiBase,
      canvasWidth: config.canvasWidth,
      canvasHeight: config.canvasHeight,
      rateLimitSeconds: config.rateLimitSeconds
    });
    this.dialogRef.nativeElement.showModal();
  }

  close(): void {
    this.dialogRef.nativeElement.close();
  }

  submit(): void {
    const current = this.configService.config();
    const next = {
      ...current,
      ...sanitizeSettings(this.formModel(), current)
    };
    const baseChanged = current.apiBase !== next.apiBase;
    this.configService.update(next);
    this.dialogRef.nativeElement.close();
    this.settingsSaved.emit({ baseChanged, config: next });
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sanitizeSettings(model: any, fallback: AppConfig): Partial<AppConfig> {
  const next: Partial<AppConfig> = {};
  if (model.apiBase) next.apiBase = model.apiBase;
  if (Number.isFinite(model.canvasWidth))
    next.canvasWidth = clamp(Number(model.canvasWidth) || fallback.canvasWidth, 50, 4000);
  if (Number.isFinite(model.canvasHeight))
    next.canvasHeight = clamp(Number(model.canvasHeight) || fallback.canvasHeight, 50, 4000);
  if (Number.isFinite(model.rateLimitSeconds))
    next.rateLimitSeconds = clamp(Number(model.rateLimitSeconds) || fallback.rateLimitSeconds, 1, 600);
  return next;
}


