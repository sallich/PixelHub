import { Injectable } from '@angular/core';
import { STORAGE_KEYS } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class StorageService {
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


