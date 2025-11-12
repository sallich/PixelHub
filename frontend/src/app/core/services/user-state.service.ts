import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private readonly storage = inject(StorageService);

  private readonly _nickname = signal(this.storage.loadNickname());
  private readonly _pixelCount = signal(0);

  readonly nickname = computed(() => this._nickname());
  readonly pixelCount = computed(() => this._pixelCount());

  setNickname(nickname: string): void {
    this._nickname.set(nickname);
    this.storage.saveNickname(nickname);
  }

  clearNickname(): void {
    this._nickname.set('');
    this.storage.clearNickname();
  }

  incrementPixelCount(): void {
    this._pixelCount.update((count) => count + 1);
  }

  resetPixelCount(): void {
    this._pixelCount.set(0);
  }
}


