import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardLoaderService } from '../../core/services/board-loader.service';
import { CanvasStateService } from '../../core/services/canvas-state.service';
import { StatusService } from '../../core/services/status.service';

@Component({
  selector: 'app-history-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history-control.component.html',
  styleUrl: './history-control.component.scss'
})
export class HistoryControlComponent {
  private readonly boardLoader = inject(BoardLoaderService);
  private readonly canvasState = inject(CanvasStateService);
  private readonly statusService = inject(StatusService);

  readonly historyMode = computed(() => this.canvasState.historyMode());
  readonly historyTimestamp = computed(() => this.canvasState.historyTimestamp());
  readonly isLoading = computed(() => this.boardLoader.loading());

  dateInput = '';
  timeInput = '';

  async loadHistory(): Promise<void> {
    if (!this.dateInput) {
      this.statusService.push('Please select a date.', 'warning');
      return;
    }

    // Формируем ISO timestamp из даты и времени
    // Бэкенд ожидает ISO 8601 формат с часовым поясом
    let timestamp: string;
    if (this.timeInput) {
      // Используем локальное время и конвертируем в ISO формат
      const dateTime = new Date(`${this.dateInput}T${this.timeInput}`);
      timestamp = dateTime.toISOString();
    } else {
      // Если время не указано, используем начало дня в локальном времени
      const dateTime = new Date(`${this.dateInput}T00:00:00`);
      timestamp = dateTime.toISOString();
    }

    // Проверяем, что дата не в будущем
    const selectedDate = new Date(timestamp);
    const now = new Date();
    if (selectedDate > now) {
      this.statusService.push('Cannot view future history.', 'warning');
      return;
    }

    try {
      await this.boardLoader.loadBoardHistory(timestamp);
    } catch (error) {
      // Ошибка уже обработана в BoardLoaderService
    }
  }

  async resetToCurrent(): Promise<void> {
    await this.boardLoader.resetToCurrent();
  }

  getDisplayTimestamp(): string {
    const timestamp = this.historyTimestamp();
    if (!timestamp) {
      return '';
    }
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  }

  getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

