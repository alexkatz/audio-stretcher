import create from 'zustand';
import { AudioStretcherDb } from '../db';
import { getArrayBufferFromAudioFile } from './getArrayBufferFromAudioFile';

// TODO: https://github.com/olvb/phaze/

export interface Player {
  isPlaying: boolean;
  isReady: boolean;
  isLoadingFile: boolean;

  displayName: string;
  source?: string;

  initializeFromFile(file: File, displayName: string): Promise<void>;
  initializeFromDb(db: AudioStretcherDb, source: string): Promise<void>;

  play(): void;
  pause(): void;

  clear(): void;
}

export const usePlayer = create<Player>((set, get) => {
  let audioContext: AudioContext;
  let audioBuffer: AudioBuffer;
  let bufferSource: AudioBufferSourceNode | undefined;
  return {
    isPlaying: false,
    isReady: false,
    isLoadingFile: false,

    displayName: '',

    play() {
      if (!get().isReady) return;

      set({ isPlaying: true });

      bufferSource = audioContext.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(audioContext.destination);
      bufferSource.start();
    },
    pause() {
      const { isReady } = get();

      if (!isReady) return;

      set({ isPlaying: false });

      bufferSource?.stop();
      bufferSource?.disconnect();
      bufferSource = undefined;
    },

    clear() {
      const { pause } = get();

      pause();
      set({ displayName: '', source: undefined, isReady: false });
    },

    async initializeFromFile(file: File, displayName = file.name) {
      set({ isLoadingFile: true });

      const buffer = await getArrayBufferFromAudioFile(file);

      audioContext = new window.AudioContext();
      audioContext.decodeAudioData(buffer, (result) => {
        audioBuffer = result;
        set({ isReady: true, isLoadingFile: false, displayName });
      });
    },

    async initializeFromDb(db, source) {
      const session = await db.getSession(source);

      if (session == null) return;

      const { file, displayName } = session;
      const { initializeFromFile } = get();

      set({ source });

      await initializeFromFile(file, displayName);
    },
  };
});
