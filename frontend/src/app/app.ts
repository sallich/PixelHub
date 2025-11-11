import { AfterViewInit, Component, DestroyRef, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { CanvasBoardComponent } from './components/canvas-board/canvas-board.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AuthDialogComponent } from './components/auth-dialog/auth-dialog.component';
import {
  SettingsDialogComponent,
  SettingsResult
} from './components/settings-dialog/settings-dialog.component';
import { AuthService } from './core/services/auth.service';
import { RealtimeService } from './core/services/realtime.service';
import { BoardLoaderService } from './core/services/board-loader.service';
import { LeaderboardService } from './core/services/leaderboard.service';
import { StatusService } from './core/services/status.service';
import { CanvasStateService } from './core/services/canvas-state.service';
import { ConfigService } from './core/services/config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ToolbarComponent,
    CanvasBoardComponent,
    SidebarComponent,
    AuthDialogComponent,
    SettingsDialogComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit {
  @ViewChild(AuthDialogComponent) private authDialog!: AuthDialogComponent;
  @ViewChild(SettingsDialogComponent) private settingsDialog!: SettingsDialogComponent;

  private readonly authService = inject(AuthService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly boardLoaderService = inject(BoardLoaderService);
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly statusService = inject(StatusService);
  private readonly canvasState = inject(CanvasStateService);
  private readonly configService = inject(ConfigService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const token = this.authService.token();
      if (token) {
        this.realtimeService.connect(token);
      } else {
        this.realtimeService.disconnect();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.realtimeService.disconnect();
      this.leaderboardService.stopAutoRefresh();
    });
  }

  async ngAfterViewInit(): Promise<void> {
    const resumed = await this.authService.resumeSession();
    if (resumed) {
      await this.initializeAuthenticatedState();
    } else {
      this.authDialog.open();
    }
  }

  async handleAuthenticated(): Promise<void> {
    await this.initializeAuthenticatedState();
  }

  openSettings(): void {
    this.settingsDialog.open();
  }

  handleSettingsSaved(result: SettingsResult): void {
    if (result.baseChanged) {
      this.canvasState.initializeBoard(result.config);
      this.statusService.push('API base changed. Please sign in again.', 'warning');
      this.realtimeService.disconnect();
      this.leaderboardService.stopAutoRefresh();
      this.leaderboardService.clear();
      this.authService.logout({ preserveNickname: true });
      this.authDialog.open();
      return;
    }

    this.initializeAuthenticatedState().catch((error) => console.error(error));
  }

  requestAuth(): void {
    this.leaderboardService.stopAutoRefresh();
    this.authDialog.open();
  }

  openAuthDialog(): void {
    this.leaderboardService.stopAutoRefresh();
    this.authDialog.open();
  }

  private async initializeAuthenticatedState(): Promise<void> {
    try {
      await this.initializeBoard();
      this.leaderboardService.startAutoRefresh();
      this.statusService.push('Ready to paint!', 'success');
    } catch (error) {
      console.error(error);
      this.statusService.push('Failed to load initial data.', 'error');
    }
  }

  private async initializeBoard(): Promise<void> {
    const config = this.configService.config();
    this.canvasState.initializeBoard(config);
    await this.boardLoaderService.initializeBoard();
  }
}


