import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { StorageService } from './storage.service';
import { UserStateService } from './user-state.service';
import { TokenDto } from '../models/api.model';

interface AuthenticateOptions {
  forceNewToken?: boolean;
  apiBaseChanged?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);
  private readonly storage = inject(StorageService);
  private readonly userState = inject(UserStateService);

  private readonly _token = signal<string | null>(this.storage.loadToken());
  private readonly _error = signal<string | null>(null);
  private readonly _authenticating = signal(false);

  readonly token = computed(() => this._token());
  readonly error = computed(() => this._error());
  readonly isAuthenticating = computed(() => this._authenticating());
  readonly isAuthenticated = computed(() => !!this._token());

  async authenticate(nickname: string, options: AuthenticateOptions = {}): Promise<TokenDto> {
    const forceNewToken = options.forceNewToken ?? false;
    const apiBaseChanged = options.apiBaseChanged ?? false;

    if (apiBaseChanged) {
      this.clearToken();
    }

    this._error.set(null);
    this._authenticating.set(true);

    try {
      let tokenDto: TokenDto;
      const currentToken = this._token();
      const storedNickname = this.userState.nickname();

      if (!forceNewToken && currentToken && storedNickname === nickname) {
        tokenDto = await this.refreshToken(currentToken, nickname);
      } else {
        tokenDto = await this.generateToken(nickname);
      }

      if (!tokenDto.token) {
        throw new Error('Token not provided by server.');
      }

      this.handleAuthSuccess(tokenDto);
      return tokenDto;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      this._error.set(message);
      throw error;
    } finally {
      this._authenticating.set(false);
    }
  }

  async resumeSession(): Promise<boolean> {
    const token = this._token();
    const nickname = this.userState.nickname();
    if (!token || !nickname) {
      return false;
    }

    try {
      const refreshed = await this.refreshToken(token, nickname);
      this.handleAuthSuccess(refreshed);
      return true;
    } catch (error) {
      this.clearToken();
      return false;
    }
  }

  logout({ preserveNickname = true }: { preserveNickname?: boolean } = {}): void {
    this.clearToken();
    if (!preserveNickname) {
      this.userState.clearNickname();
      this.userState.resetPixelCount();
    }
  }

  setError(message: string | null): void {
    this._error.set(message);
  }

  private handleAuthSuccess(dto: TokenDto): void {
    this._token.set(dto.token);
    this.storage.saveToken(dto.token);

    const currentNickname = this.userState.nickname();
    if (currentNickname !== dto.nickname) {
      this.userState.resetPixelCount();
    }

    this.userState.setNickname(dto.nickname);
  }

  private clearToken(): void {
    this._token.set(null);
    this.storage.clearToken();
  }

  private resolveUrl(path: string): string {
    const base = this.configService.config().apiBase.replace(/\/+$/, '');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
  }

  private async generateToken(nickname: string): Promise<TokenDto> {
    const url = this.resolveUrl('/token');
    return firstValueFrom(
      this.http.post<TokenDto>(url, { nickname }, { headers: { 'Content-Type': 'application/json' } })
    );
  }

  private async refreshToken(token: string, nickname: string): Promise<TokenDto> {
    const url = this.resolveUrl('/token-refresh');
    return firstValueFrom(
      this.http.post<TokenDto>(
        url,
        { token, nickname },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token
          }
        }
      )
    );
  }
}


