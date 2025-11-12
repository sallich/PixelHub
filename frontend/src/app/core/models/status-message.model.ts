export type StatusLevel = 'info' | 'success' | 'warning' | 'error';

export interface StatusMessage {
  id: number;
  level: StatusLevel;
  text: string;
  timestamp: number;
}


