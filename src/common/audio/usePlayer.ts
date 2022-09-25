import create from 'zustand';
import { getAudioContext } from './getAudioContext';

// TODO: https://github.com/olvb/phaze/

type InitializeParams = {
  audioBuffer: AudioBuffer;
  displayName: string;
  source: string;
};

export type Player = {
  isPlaying: boolean;
  isReady: boolean;
  displayName: string;
  source?: string;

  initialize(params: InitializeParams): void;
  play(): void;
  pause(): void;
  clear(): void;
};

const defaultValues: StripFunctions<Player> = {
  displayName: '',
  isPlaying: false,
  isReady: false,
  source: undefined,
};

export const usePlayer = create<Player>((set, get) => {
  let audioContext: AudioContext;
  let audioBuffer: AudioBuffer;
  let bufferSource: AudioBufferSourceNode | undefined;
  return {
    ...defaultValues,

    play() {
      if (!get().isReady) return;

      set({ isPlaying: true });

      bufferSource = audioContext.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(audioContext.destination);
      bufferSource.start();
    },
    pause() {
      if (!get().isReady) return;

      set({ isPlaying: false });

      bufferSource?.stop();
      bufferSource?.disconnect();
      bufferSource = undefined;
    },

    clear() {
      get().pause();
      set(defaultValues);
    },

    initialize({ audioBuffer: buffer, displayName, source }: InitializeParams) {
      audioContext = getAudioContext();
      audioBuffer = buffer;
      set({
        isReady: true,
        displayName,
        source,
      });
    },
  };
});
