import create from 'zustand';
import { AudioStretcherDb } from '../db';
import { getArrayBufferFromAudioFile } from './getArrayBufferFromAudioFile';

// TODO: https://github.com/olvb/phaze/

export type Player = {
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
};

const defaultValues: StripFunctions<Player> = {
  displayName: '',
  isPlaying: false,
  isLoadingFile: false,
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

      set({ source });

      await db.updateLastOpenedAt(source);
      await get().initializeFromFile(file, displayName);
    },
  };
});
