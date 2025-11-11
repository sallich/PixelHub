import { AppConfig } from '../models/app-config.model';

export const DEFAULT_CONFIG: AppConfig = {
  apiBase: typeof window !== 'undefined' ? window.location.origin : '',
  wsPath: '/ws',
  boardEndpoint: '/full-board',
  pixelDestination: '/app/pixel',
  pixelTopic: '/topic/pixels',
  leaderboardEndpoint: '/leaderboard',
  canvasWidth: 2000,
  canvasHeight: 2000,
  rateLimitSeconds: 1
};

export const STORAGE_KEYS = {
  config: 'pixelhub:config',
  nickname: 'pixelhub:nickname',
  pixelCount: 'pixelhub:pixelCount',
  token: 'pixelhub:token'
} as const;


