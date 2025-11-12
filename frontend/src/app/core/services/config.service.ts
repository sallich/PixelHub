import { Injectable, computed, signal } from '@angular/core';
import { AppConfig } from '../models/app-config.model';
import { DEFAULT_CONFIG } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly _config = signal<AppConfig>({ ...DEFAULT_CONFIG });
  readonly config = computed(() => this._config());
}


