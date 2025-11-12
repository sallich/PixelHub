import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { StatusService } from '../../core/services/status.service';
import { HistoryControlComponent } from '../history-control/history-control.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, HistoryControlComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly statusService = inject(StatusService);

  readonly leaderboard = computed(() => this.leaderboardService.leaders());
  readonly statuses = computed(() => this.statusService.statusList());
}


