import { Injectable } from '@angular/core';
import { AppConfig } from '../models/app-config.model';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class StorageService {
  loadConfig(): AppConfig {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_CONFIG };
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.config);
      if (!stored) {
        return { ...DEFAULT_CONFIG };
      }
      const parsed = JSON.parse(stored) as Partial<AppConfig>;
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch (error) {
      console.warn('Failed to parse stored config', error);
      return { ...DEFAULT_CONFIG };
    }
  }

  saveConfig(config: AppConfig): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config));
  }

  loadNickname(): string {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEYS.nickname) ?? '';
  }

  saveNickname(value: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.nickname, value);
  }

  clearNickname(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEYS.nickname);
  }


  loadToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(STORAGE_KEYS.token);
  }

  saveToken(value: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.token, value);
  }

  clearToken(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEYS.token);
  }
}


