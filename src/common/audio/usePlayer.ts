import create from 'zustand';
import { AudioSession } from '../db';
import { getAudioContext } from './getAudioContext';

// TODO: https://github.com/olvb/phaze/

export type InitializeParams = Pick<AudioSession, 'arrayBuffer' | 'source' | 'displayName'>;

export type Player = {
  isPlaying: boolean;
  status: 'ready' | 'initializing' | 'uninitialized' | 'failed-to-initialize';
  displayName: string;
  source?: string;

  initialize(params: InitializeParams): Promise<void>;

  play(): void;
  pause(): void;
  clear(): void;
};

const defaultValues: StripFunctions<Player> = {
  displayName: '',
  isPlaying: false,
  status: 'uninitialized',
  source: undefined,
};

export const usePlayer = create<Player>((set, get) => {
  let audioContext: AudioContext;
  let audioBuffer: AudioBuffer;
  let bufferSource: AudioBufferSourceNode | undefined;

  return {
    ...defaultValues,

    play() {
      if (get().status !== 'ready') return;

      set({ isPlaying: true });

      bufferSource = audioContext.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(audioContext.destination);
      bufferSource.start();
    },
    pause() {
      if (get().status !== 'ready') return;

      set({ isPlaying: false });

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

        set({ status: 'ready', displayName, source });
      } catch (error) {
        console.error(error);
        set({ status: 'failed-to-initialize' });
      }
    },
  };
});
