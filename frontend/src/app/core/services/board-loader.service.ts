import { Injectable, inject, computed, signal } from '@angular/core';
import { BoardApiService } from './board-api.service';
import { CanvasStateService } from './canvas-state.service';
import { AuthService } from './auth.service';
import { StatusService } from './status.service';

@Injectable({ providedIn: 'root' })
export class BoardLoaderService {
  private readonly boardApi = inject(BoardApiService);
  private readonly canvasState = inject(CanvasStateService);
  private readonly authService = inject(AuthService);
  private readonly statusService = inject(StatusService);
  private readonly _loading = signal(false);

  readonly loading = computed(() => this._loading());

  async initializeBoard(): Promise<void> {
    const token = this.authService.token();
    if (!token) {
      return;
    }
    this._loading.set(true);
    try {
      const response = await this.boardApi.fetchBoard(token);
      this.canvasState.loadPixels(response.pixels ?? []);
      this.statusService.push(`Loaded ${response.pixels.length} pixels.`, 'info');
    } finally {
      this._loading.set(false);
    }
  }

  async loadBoardHistory(timestamp: string): Promise<void> {
    const token = this.authService.token();
    if (!token) {
      this.statusService.push('Sign in to view history.', 'warning');
      return;
    }
    this._loading.set(true);
    try {
      const response = await this.boardApi.fetchBoardHistory(token, timestamp);
      this.canvasState.loadPixels(response.pixels ?? []);
      this.canvasState.setHistoryMode(true, timestamp);
      this.statusService.push(`Loaded history: ${response.pixels.length} pixels at ${new Date(timestamp).toLocaleString()}.`, 'info');
    } catch (error: any) {
      const message = error?.error?.message || error?.message || 'Failed to load board history.';
      this.statusService.push(message, 'error');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async resetToCurrent(): Promise<void> {
    this.canvasState.resetToCurrent();
    await this.initializeBoard();
    this.statusService.push('Reset to current board state.', 'info');
  }
}


