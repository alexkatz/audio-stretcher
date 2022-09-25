import create from 'zustand';
import { AddSessionParams, AudioSession, db } from '../db';
import { getAudioBufferFromArrayBuffer } from './getArrayBufferFromAudioFile';

export type StoreState = {
  youtubeUrl: string;
  downloadProgress: number;
  isDownloadingAudio: boolean;
  isValidYoutubeUrl: boolean;

  getSessionFromYoutube(): Promise<AudioSession | undefined>;
  getSessionFromDb(source: string): Promise<AudioSession | undefined>;
  createSession(params: AddSessionParams): Promise<AudioSession | undefined>;
};

export const useStore = create<StoreState>((set, get) => {
  const readAudio = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    arrays: Uint8Array[],
    totalLength: number,
    currentLength = 0,
  ): Promise<AudioBuffer> => {
    const readResult = await reader.read();
    if (readResult.done) {
      const array = new Uint8Array(currentLength);
      arrays.reduce((length, arr) => {
        array.set(arr, length);
        return (length += arr.length);
      }, 0);
      set({ isDownloadingAudio: false });
      return await getAudioBufferFromArrayBuffer(array.buffer);
    } else {
      const array = readResult.value;
      arrays.push(array);
      currentLength += array.length;
      const downloadProgress = currentLength / totalLength;
      set({ downloadProgress });
      return await readAudio(reader, arrays, totalLength, currentLength);
    }
  };

  return {
    downloadProgress: 0,
    youtubeUrl: '',
    isDownloadingAudio: false,
    isValidYoutubeUrl: false,

    async getSessionFromYoutube() {
      if (!get().isValidYoutubeUrl) return;
      set({ isDownloadingAudio: true });

      const { youtubeUrl } = get();

      const session = await db.getSession(youtubeUrl);
      if (session != null) {
        set({ isDownloadingAudio: false });
        return session;
      }

      const res = await fetch(`/api/audio?url=${encodeURIComponent(youtubeUrl)}`);
      const stream = res.body;
      const totalLength = Number(res.headers.get('Content-Length'));
      const reader = stream?.getReader();

      if (!reader) {
        set({ isDownloadingAudio: false });
        return;
      }

      const audioBuffer = await readAudio(reader, [], totalLength);

      return await db.addSession({
        audioBuffer,
        source: youtubeUrl,
        displayName: youtubeUrl, // TODO: get title from youtube,
      });
    },

    getSessionFromDb(source) {
      return db.getSession(source);
    },

    createSession(params) {
      return db.addSession(params);
    },
  };
});
