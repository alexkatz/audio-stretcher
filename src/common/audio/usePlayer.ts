import create from 'zustand';
import { getArrayBufferFromAudioFile } from './getArrayBufferFromAudioFile';

export interface Player {
  isPlaying: boolean;
  isReady: boolean;
  isLoadingFile: boolean;
  fileName: string;
  setFile(file: File): void;
  play(): void;
  pause(): void;
}

export const usePlayer = create<Player>((set, get) => {
  let audioContext: AudioContext;
  let audioBuffer: AudioBuffer;
  let bufferSource: AudioBufferSourceNode | undefined;
  return {
    isPlaying: false,
    isReady: false,
    isLoadingFile: false,

    fileName: '',

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

    async setFile(file: File) {
      set({ isLoadingFile: true });
      const buffer = await getArrayBufferFromAudioFile(file);
      audioContext = new window.AudioContext();
      audioContext.decodeAudioData(buffer, (result) => {
        audioBuffer = result;
        set({ isReady: true, isLoadingFile: false, fileName: file.name });
      });
    },
  };
});
