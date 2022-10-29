import create from 'zustand';
import { getIsValidYoutubeUrl } from '~/utils/validateYoutubeUrl';
import { AddSessionParams, AudioSession, db } from '../db';
import { HEADER_KEYS } from '../headerKeys';

export type StoreState = {
  youtubeUrl: string;
  setYoutubeUrl(url: string): void;

  downloadProgress: number;
  isDownloadingAudio: boolean;
  isValidYoutubeUrl: boolean;

  getSessionFromYoutube(): Promise<AudioSession | undefined>;
  cancelGetSessionFromYoutube(): void;

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
    set({ downloadProgress: currentLength / totalLength, isDownloadingAudio: currentLength !== totalLength });
    return await readToArrayBuffer(reader, totalLength, array, currentLength);
  };

  let abortController: AbortController | undefined;

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

    cancelGetSessionFromYoutube() {
      if (!get().isDownloadingAudio) return;

      abortController?.abort();
      abortController = undefined;

      set({ downloadProgress: 0, isDownloadingAudio: false });
    },

    async getSessionFromYoutube() {
      try {
        const { isValidYoutubeUrl, youtubeUrl } = get();

        if (!isValidYoutubeUrl) return;

        const session = await db.getSession(youtubeUrl);
        if (session != null) {
          return session;
        }

        set({ isDownloadingAudio: true });

        const res = await fetch(`/api/audio?url=${encodeURIComponent(youtubeUrl)}`, {
          signal: (abortController = new AbortController()).signal,
        });

        const stream = res.body;
        const totalLength = Number(res.headers.get(HEADER_KEYS.CONTENT_LENGTH));
        const title = res.headers.get(HEADER_KEYS.CONTENT_TITLE);
        const reader = stream?.getReader();

        if (!reader) {
          set({ isDownloadingAudio: false });
          return;
        }

        const arrayBuffer = await readToArrayBuffer(reader, totalLength);

        return await db.addSession({
          arrayBuffer,
          source: youtubeUrl,
          displayName: title ?? youtubeUrl,
        });
      } catch (e) {
        console.log(e);
      }
    },
  };
});
