import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AppConfig } from '../models/app-config.model';
import { StorageService } from './storage.service';
import { DEFAULT_CONFIG } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly storage = inject(StorageService);

  private readonly _config = signal<AppConfig>({
    ...DEFAULT_CONFIG,
    ...this.storage.loadConfig()
  });
  readonly config = computed(() => this._config());

  constructor() {
    effect(() => {
      this.storage.saveConfig(this._config());
    });
  }

  update(partial: Partial<AppConfig>): void {
    this._config.update((current) => ({
      ...current,
      ...partial
    }));
  }

  reset(): void {
    this._config.set({ ...DEFAULT_CONFIG });
  }
}


