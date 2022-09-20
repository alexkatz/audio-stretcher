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
      createdAt: number;
    };
    key: string;
    indexes: { source: string; createdAt: number };
  };
}

export type AudioSession = StoreValue<AudioStretcherSchema, 'sessions'>;
export type AddSessionOptions = Omit<AudioSession, 'createdAt'>;
export type AudioSessionSummary = Omit<AudioSession, 'file'>;

type GetSessionSummariesResponse = {
  sessions: AudioSessionSummary[];
  nextCursor?: number;
  total: number;
};

export enum DbQueryKey {
  Sessions = 'sessions',
  SessionSummaries = 'session-summaries',
}

export interface AudioStretcherDb {
  addSession(options: AddSessionOptions): Promise<string | undefined>;
  getSession(source: string): Promise<AudioSession | undefined>;
  getSessionSummaries(limit: number, nextCursor?: number): Promise<GetSessionSummariesResponse>;
  close(): void;
}

const createDb = (): AudioStretcherDb => {
  let db: IDBPDatabase<AudioStretcherSchema> | undefined;

  const ensureDbIsOpen = async () => {
    if (db != null || typeof window === 'undefined' || window.indexedDB == null) return;
    db = await openDB(CONFIG.name, CONFIG.version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const objectStore = db.createObjectStore('sessions', { keyPath: 'source' });

          const indexNames = objectStore.indexNames;
          if (!indexNames.contains('createdAt')) {
            objectStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          if (!indexNames.contains('source')) {
            objectStore.createIndex('source', 'source', { unique: true });
          }
        }
      },
    });
  };

  return {
    close() {
      db?.close();
    },

    async addSession(options) {
      await ensureDbIsOpen();

      return await db?.put('sessions', {
        ...options,
        createdAt: Date.now(),
      });
    },

    async getSession(source) {
      await ensureDbIsOpen();

      return db?.get('sessions', source);
    },
    async getSessionSummaries(limit, nextCursor) {
      await ensureDbIsOpen();

      const sessions: AudioSessionSummary[] = [];
      const range = IDBKeyRange.upperBound(nextCursor ?? Date.now());

      let cursor = await db?.transaction('sessions').store.index('createdAt').openCursor(range, 'prev');
      let count = limit;

      while (count > 0 && cursor) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { file, ...summary } = cursor.value;
        sessions.push(summary);
        count -= 1;
        cursor = await cursor.continue();
      }

      return {
        sessions,
        nextCursor: cursor?.value.createdAt,
        total: (await cursor?.source.count()) ?? 0,
      };
    },
  };
};

export const db = createDb();
