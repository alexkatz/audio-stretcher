import dayjs from 'dayjs';
import { openDB, IDBPDatabase, DBSchema, StoreValue } from 'idb';

const CONFIG = {
  version: 1,
  name: 'audio-stretcher',
} as const;

interface AudioStretcherSchema extends DBSchema {
  sessions: {
    value: {
      source: string;
      displayName: string;
      file: File;
      createdAt: string;
      lastOpenedAt: string;
    };
    key: string;
    indexes: { source: string; createdAt: string; lastOpenedAt: string };
  };
}

export type AudioSession = StoreValue<AudioStretcherSchema, 'sessions'>;
export type AddSessionOptions = Omit<AudioSession, 'createdAt' | 'lastOpenedAt'>;
export type AudioSessionSummary = Omit<AudioSession, 'file'>;

type GetSessionSummariesResponse = {
  summaries: AudioSessionSummary[];
  nextCursor?: string;
  total: number;
};

export type AudioStretcherDb = {
  addSession(options: AddSessionOptions): Promise<string | undefined>;
  getSession(source: string): Promise<AudioSession | undefined>;
  getSessionSummaries(limit: number, nextCursor?: string): Promise<GetSessionSummariesResponse>;
  updateLastOpenedAt(source: string): Promise<void>;
  close(): void;
};

const createDb = (): AudioStretcherDb => {
  let db: IDBPDatabase<AudioStretcherSchema> | undefined;

  const ensureDbIsOpen = async () => {
    if (db != null || typeof window === 'undefined' || window.indexedDB == null) return;
    db = await openDB(CONFIG.name, CONFIG.version, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        const objectStore = db.objectStoreNames.contains('sessions')
          ? transaction.objectStore('sessions')
          : db.createObjectStore('sessions', { keyPath: 'source' });

        const indexNames = objectStore.indexNames;

        if (!indexNames.contains('createdAt')) {
          objectStore.createIndex('createdAt', 'createdAt', { unique: true });
        }

        if (!indexNames.contains('source')) {
          objectStore.createIndex('source', 'source', { unique: true });
        }

        if (!indexNames.contains('lastOpenedAt')) {
          objectStore.createIndex('lastOpenedAt', 'lastOpenedAt', { unique: false });
        }
      },
    });
  };

  return {
    close() {
      db?.close();
    },

    async updateLastOpenedAt(source) {
      await ensureDbIsOpen();
      const session = await db?.get('sessions', source);
      if (session) {
        await db?.put('sessions', { ...session, lastOpenedAt: dayjs().toISOString() });
      }
    },

    async addSession(options) {
      await ensureDbIsOpen();
      const createdAt = dayjs().toISOString();
      return await db?.put('sessions', {
        ...options,
        createdAt,
        lastOpenedAt: createdAt,
      });
    },

    async getSession(source) {
      await ensureDbIsOpen();
      return db?.get('sessions', source);
    },

    async getSessionSummaries(limit, nextCursor) {
      await ensureDbIsOpen();
      const summaries: AudioSessionSummary[] = [];
      const total = (await db?.countFromIndex('sessions', 'lastOpenedAt')) ?? 0;
      const range = IDBKeyRange.upperBound(nextCursor ?? dayjs().toISOString());

      let cursor = await db?.transaction('sessions').store.index('lastOpenedAt').openCursor(range, 'prev');
      let count = limit;

      while (count > 0 && cursor) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { file, ...summary } = cursor.value;
        summaries.push({
          ...summary,
          lastOpenedAt: summary.lastOpenedAt ?? summary.createdAt,
        });
        count -= 1;
        cursor = await cursor.continue();
      }

      return {
        summaries,
        nextCursor: cursor?.value.lastOpenedAt,
        total,
      };
    },
  };
};

export const db = createDb();
