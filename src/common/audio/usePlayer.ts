import create from 'zustand';
import { AudioSession } from '../db';
import { getAudioContext } from './getAudioContext';
import { playerIsReady } from './playerIsReady';

// TODO: https://github.com/olvb/phaze/

export type InitializeParams = Pick<AudioSession, 'arrayBuffer' | 'source' | 'displayName'>;

export type PlayerStatus = 'paused' | 'playing' | 'initializing' | 'uninitialized' | 'failed-to-initialize';

export type Player = {
  status: PlayerStatus;

  displayName?: string;
  leftChannelData?: Float32Array;
  rightChannelData?: Float32Array;
  monoChannelData?: Float32Array;
  duration?: number;
  source?: string;

  initialize(params: InitializeParams): Promise<void>;

  play(): void;
  pause(): void;
  clear(): void;
};

const defaultValues: Complete<StripFunctions<Player>> = {
  displayName: '',
  status: 'uninitialized',
  source: undefined,
  leftChannelData: undefined,
  rightChannelData: undefined,
  monoChannelData: undefined,
  duration: undefined,
};

export const usePlayer = create<Player>((set, get) => {
  let audioContext: AudioContext;
  let bufferSource: AudioBufferSourceNode | undefined;
  let audioBuffer: AudioBuffer;

  return {
    ...defaultValues,

    play() {
      const { status } = get();
      if (!playerIsReady(status) || status === 'playing') return;

      set({ status: 'playing' });

      bufferSource = audioContext.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(audioContext.destination);
      bufferSource.start();
    },
    pause() {
      const { status } = get();
      if (!playerIsReady(status) || status === 'paused') return;

      set({ status: 'paused' });

      bufferSource?.stop();
      bufferSource?.disconnect();
      bufferSource = undefined;
    },

    clear() {
      get().pause();
      set(defaultValues);
    },

    async initialize({ arrayBuffer, displayName, source }) {
      try {
        set({ status: 'initializing' });

        audioContext = getAudioContext();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const leftChannelData = audioBuffer.getChannelData(0);
        const rightChannelData = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : undefined;
        const monoChannelData =
          rightChannelData == null
            ? leftChannelData
            : leftChannelData.map((left, i) => (left + (rightChannelData[i] ?? left)) / 2);

        set({
          status: 'paused',
          displayName,
          source,
          leftChannelData,
          rightChannelData,
          monoChannelData,
        });
      } catch (error) {
        console.log(error);
        set({ status: 'failed-to-initialize' });
      }
    },
  };
});
