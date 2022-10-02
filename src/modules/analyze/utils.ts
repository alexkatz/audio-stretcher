import { playerIsReady } from '~/audio/playerIsReady';
import { PlayerStatus } from '~/audio/usePlayer';

export function assertsIsReady(status: PlayerStatus): asserts status is 'paused' | 'playing' {
  if (!playerIsReady(status)) {
    throw new Error('Player is not ready');
  }
}

export function assertChannelData(channelData: Float32Array | undefined): asserts channelData is Float32Array {
  if (channelData == null) {
    throw new Error('Left channel data is not ready');
  }
}

export const findPeak = (channelData: Float32Array, from: number, to: number, isPositive: boolean) => {
  let peak = 0;

  for (let i = from; i < to; i += 1) {
    const sample = channelData[i]!;
    if ((isPositive && sample > peak) || (!isPositive && sample < peak)) {
      peak = sample;
    }
  }

  return peak;
};

export const findAverage = (channelData: Float32Array, from: number, to: number, isPositive: boolean) => {
  let sum = 0;
  let includedCount = 0;

  for (let i = from; i < to; i += 1) {
    const sample = channelData[i]!;
    if ((isPositive && sample > 0) || (!isPositive && sample < 0)) {
      sum += sample;
      includedCount += 1;
    }
  }

  return sum / includedCount;
};
