import create from 'zustand';
import { getIsValidYoutubeUrl } from '~/utils/validateYoutubeUrl';
import { AddSessionParams, AudioSession, db } from '../db';
import { HEADER_KEYS } from '../HeaderKey';

export type StoreState = {
  youtubeUrl: string;
  setYoutubeUrl(url: string): void;

  downloadProgress: number;
  isDownloadingAudio: boolean;
  isValidYoutubeUrl: boolean;

  getSessionFromYoutube(): Promise<AudioSession | undefined>;
  getSessionFromDb(source: string): Promise<AudioSession | undefined>;
  createSession(params: AddSessionParams): Promise<AudioSession | undefined>;
};

export const useStore = create<StoreState>((set, get) => {
  const readToArrayBuffer = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    totalLength: number,
    array = new Uint8Array(totalLength),
    currentLength = 0,
  ): Promise<ArrayBuffer> => {
    const readResult = await reader.read();
    if (readResult.done) return array.buffer;
    array.set(readResult.value, currentLength);
    currentLength += readResult.value.length;
    set({ downloadProgress: currentLength / totalLength });
    return await readToArrayBuffer(reader, totalLength, array, currentLength);
  };

  return {
    downloadProgress: 0,
    youtubeUrl: '',
    isDownloadingAudio: false,
    isValidYoutubeUrl: false,

    setYoutubeUrl(url) {
      set({ youtubeUrl: url, isValidYoutubeUrl: getIsValidYoutubeUrl(url) });
    },

    getSessionFromDb(source) {
      return db.getSession(source);
    },

    createSession(params) {
      return db.addSession(params);
    },

    async getSessionFromYoutube() {
      const { isValidYoutubeUrl, youtubeUrl } = get();

      if (!isValidYoutubeUrl) return;

      set({ isDownloadingAudio: true });

      const session = await db.getSession(youtubeUrl);
      if (session != null) {
        set({ isDownloadingAudio: false });
        return session;
      }

      const res = await fetch(`/api/audio?url=${encodeURIComponent(youtubeUrl)}`);
      const stream = res.body;
      res.headers.forEach((value, key) => console.log(key, value));
      const totalLength = Number(res.headers.get(HEADER_KEYS.CONTENT_LENGTH));
      const title = res.headers.get(HEADER_KEYS.CONTENT_TITLE);
      const reader = stream?.getReader();

      if (!reader) {
        set({ isDownloadingAudio: false });
        return;
      }

      const arrayBuffer = await readToArrayBuffer(reader, totalLength);

      set({ isDownloadingAudio: false });

      return await db.addSession({
        arrayBuffer,
        source: youtubeUrl,
        displayName: title ?? youtubeUrl,
      });
    },
  };
});
