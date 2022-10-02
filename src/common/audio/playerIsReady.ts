import { PlayerStatus } from './usePlayer';

export const playerIsReady = (status: PlayerStatus): status is 'playing' | 'paused' =>
  status === 'playing' || status === 'paused';
