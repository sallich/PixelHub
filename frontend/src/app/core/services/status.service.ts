import { Injectable, computed, signal } from '@angular/core';
import { StatusLevel, StatusMessage } from '../models/status-message.model';

@Injectable({ providedIn: 'root' })
export class StatusService {
  private readonly messages = signal<StatusMessage[]>([]);

  readonly statusList = computed(() => this.messages());

  push(text: string, level: StatusLevel = 'info'): void {
    const entry: StatusMessage = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      level,
      text,
      timestamp: Date.now()
    };
    this.messages.update((current) => [entry, ...current].slice(0, 20));
  }

  clear(): void {
    this.messages.set([]);
  }
}


