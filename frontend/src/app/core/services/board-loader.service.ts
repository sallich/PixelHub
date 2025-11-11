import { Injectable, inject } from '@angular/core';
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

  async initializeBoard(): Promise<void> {
    const token = this.authService.token();
    if (!token) {
      return;
    }
    const response = await this.boardApi.fetchBoard(token);
    this.canvasState.loadPixels(response.pixels ?? []);
    this.statusService.push(`Loaded ${response.pixels.length} pixels.`, 'info');
  }
}


