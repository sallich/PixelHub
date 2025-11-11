import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LeaderBoardResponse, BoardResponse } from '../models/api.model';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class BoardApiService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);

  async fetchBoard(token: string): Promise<BoardResponse> {
    const url = this.resolveUrl(this.configService.config().boardEndpoint);
    const response = await firstValueFrom(
      this.http.get<BoardResponse>(url, { headers: this.buildAuthHeaders(token) })
    );
    return response;
  }

  async fetchLeaderboard(token: string): Promise<LeaderBoardResponse> {
    const url = this.resolveUrl(this.configService.config().leaderboardEndpoint);
    return firstValueFrom(
      this.http.get<LeaderBoardResponse>(url, { headers: this.buildAuthHeaders(token) })
    );
  }

  private resolveUrl(path: string): string {
    const base = this.configService.config().apiBase.replace(/\/+$/, '');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
  }

  private buildAuthHeaders(token: string, extra: Record<string, string> = {}): HttpHeaders {
    let headers = new HttpHeaders(extra);
    headers = headers.set('Authorization', token);
    return headers;
  }
}


