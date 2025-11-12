import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CooldownService {
  private readonly _cooldownUntil = signal<number | null>(null);
  private readonly _timerId = signal<number | null>(null);

  readonly remainingSeconds = computed(() => {
    const until = this._cooldownUntil();
    if (!until) {
      return 0;
    }
    const remaining = until - Date.now();
    return remaining <= 0 ? 0 : Math.ceil(remaining / 1000);
  });

  readonly isActive = computed(() => this.remainingSeconds() > 0);

  start(seconds: number): void {
    this.stop();
    const until = Date.now() + seconds * 1000;
    this._cooldownUntil.set(until);
    const id = window.setInterval(() => {
      if (Date.now() >= until) {
        this.stop();
      } else {
        this._cooldownUntil.set(until);
      }
    }, 500);
    this._timerId.set(id);
  }

  stop(): void {
    const id = this._timerId();
    if (id !== null) {
      window.clearInterval(id);
      this._timerId.set(null);
    }
    this._cooldownUntil.set(null);
  }
}


