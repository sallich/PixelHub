import { AppConfig } from '../models/app-config.model';
import { environment } from '../../../environments/environment';

export const DEFAULT_CONFIG: AppConfig = {
  apiBase: environment.apiBase || (typeof window !== 'undefined' ? window.location.origin : ''),
  wsPath: '/ws',
  boardEndpoint: '/full-board',
  pixelDestination: '/app/pixel',
  pixelTopic: '/topic/pixels',
  leaderboardEndpoint: '/leaderboard',
  canvasWidth: environment.canvasWidth,
  canvasHeight: environment.canvasHeight,
  rateLimitSeconds: environment.rateLimitSeconds
};

export const STORAGE_KEYS = {
  nickname: 'pixelhub:nickname',
  pixelCount: 'pixelhub:pixelCount',
  token: 'pixelhub:token'
} as const;


