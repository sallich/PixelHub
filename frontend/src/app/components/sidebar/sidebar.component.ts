import { Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStateService } from '../../core/services/user-state.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { StatusService } from '../../core/services/status.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly userState = inject(UserStateService);
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly statusService = inject(StatusService);

  @Output() changeNickname = new EventEmitter<void>();

  readonly nickname = computed(() => this.userState.nickname());
  readonly pixelCount = computed(() => this.userState.pixelCount());
  readonly leaderboard = computed(() => this.leaderboardService.leaders());
  readonly statuses = computed(() => this.statusService.statusList());

  onChangeNickname(): void {
    this.changeNickname.emit();
  }
}


