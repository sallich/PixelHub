import { Injectable, computed, inject, signal } from '@angular/core';
import { BoardApiService } from './board-api.service';
import { AuthService } from './auth.service';
import { UserDto } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly boardApi = inject(BoardApiService);
  private readonly authService = inject(AuthService);

  private readonly _leaders = signal<UserDto[]>([]);
  private refreshTimer: number | null = null;

  readonly leaders = computed(() => this._leaders());

  async refresh(): Promise<void> {
    const token = this.authService.token();
    if (!token) {
      this._leaders.set([]);
      return;
    }
    const response = await this.boardApi.fetchLeaderboard(token);
    this._leaders.set(response.users ?? []);
  }

  clear(): void {
    this._leaders.set([]);
  }

  startAutoRefresh(intervalMs = 30000): void {
    this.stopAutoRefresh();
    this.refresh().catch(console.error);
    this.refreshTimer = window.setInterval(() => {
      this.refresh().catch(console.error);
    }, intervalMs);
  }

  stopAutoRefresh(): void {
    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}


