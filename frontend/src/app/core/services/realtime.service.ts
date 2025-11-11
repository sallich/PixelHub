import { Injectable, computed, inject, signal } from '@angular/core';
import SockJS from 'sockjs-client';
import { Client as StompClient, IFrame, IMessage } from '@stomp/stompjs';
import { ConfigService } from './config.service';
import { CanvasStateService } from './canvas-state.service';
import { StatusService } from './status.service';
import { PixelDto } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly configService = inject(ConfigService);
  private readonly canvasState = inject(CanvasStateService);
  private readonly statusService = inject(StatusService);

  private client: StompClient | null = null;
  private readonly _connected = signal(false);

  readonly connected = computed(() => this._connected());

  connect(token: string, onQueueFlush?: () => void): void {
    const url = this.resolveWebsocketUrl();
    if (this.client) {
      this.client.deactivate();
    }

    this.client = new StompClient({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => undefined,
      connectHeaders: {
        Authorization: token
      }
    });

    this.client.onConnect = () => {
      this._connected.set(true);
      this.statusService.push('Connected to canvas.', 'success');
      this.client?.subscribe(this.configService.config().pixelTopic, (message: IMessage) => {
        try {
          const payload = JSON.parse(message.body) as { type: string; content: PixelDto };
          if (payload.type === 'get' && payload.content) {
            this.canvasState.applyPixel(payload.content);
          }
        } catch (error) {
          console.error('Failed to parse incoming pixel message', error);
        }
      });
      onQueueFlush?.();
    };

    this.client.onStompError = (frame: IFrame) => {
      this.statusService.push(`Broker error: ${frame.body}`, 'error');
      this.disconnect();
    };

    this.client.onWebSocketClose = () => {
      this._connected.set(false);
      this.statusService.push('Disconnected from canvas.', 'warning');
    };

    this.client.onDisconnect = () => {
      this._connected.set(false);
    };

    this.client.activate();
  }

  sendPixel(pixel: PixelDto): void {
    if (!this.client || !this._connected()) {
      throw new Error('Not connected to realtime service.');
    }

    this.client.publish({
      destination: this.configService.config().pixelDestination,
      body: JSON.stringify({ type: 'send', content: pixel })
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this._connected.set(false);
  }

  private resolveWebsocketUrl(): string {
    const base = this.configService.config().apiBase.replace(/\/+$/, '');
    const wsPath = this.configService.config().wsPath.startsWith('/')
      ? this.configService.config().wsPath
      : `/${this.configService.config().wsPath}`;
    return `${base}${wsPath}`;
  }
}


