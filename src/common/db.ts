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
      createdAt: Date;
    };
    key: string;
    indexes: { source: string; createdAt: Date };
  };
}

type Session = StoreValue<AudioStretcherSchema, 'sessions'>;
type AddSessionOptions = Omit<Session, 'createdAt'>;

export interface AudioStretcherDb {
  addSession(options: AddSessionOptions): Promise<string | undefined>;
  getSession(source: string): Promise<Session | undefined>;
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
        createdAt: new Date(),
      });
    },

    async getSession(source) {
      await ensureDbIsOpen();

      return db?.get('sessions', source);
    },
  };
};

export const db = createDb();
