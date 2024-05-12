import { openDB, DBSchema, IDBPDatabase } from "idb";

const KEY_DB_NAME = "kdb";
const KEY_DB_VERSION = 1;
const KEY_STORE_NAME = "ak";

interface KeyDB extends DBSchema {
  ak: {
    key: string;
    value: {
      data: CryptoKey;
      setOn: number;
      usages: KeyUsage[];
    };
  };
}

let keyDb: IDBPDatabase<KeyDB> | undefined;

const getDB = async () => {
  if (keyDb) {
    return keyDb;
  }
  try {
    keyDb = await openDB<KeyDB>(KEY_DB_NAME, KEY_DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(KEY_STORE_NAME);
      }
    });
    return keyDb;
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    throw new Error("Error opening key database");
  }
};

export const storeKey = async (key: CryptoKey, keyId: string) => {
  const db = await getDB();

  await db.add(
    "ak",
    {
      data: key,
      setOn: new Date().getTime(),
      usages: key.usages
    },
    keyId
  );
};

export const updateKey = async (key: CryptoKey, keyId: string) => {
  const db = await getDB();

  await db.put(
    KEY_STORE_NAME,
    {
      data: key,
      setOn: new Date().getTime(),
      usages: key.usages
    },
    keyId
  );
};

export const getKey = async (keyId: string) => {
  const db = await getDB();

  const key = await db.get(KEY_STORE_NAME, keyId);
  if (!key) {
    return;
  }

  // Delete the key if it is older than 14 days
  if (key.setOn < new Date(new Date().getDate() + 14).getTime()) {
    await db.delete(KEY_STORE_NAME, keyId);
    return;
  }

  return key.data;
};

export const getMasterKey = async (userId: string) => {
  const key = await getKey(userId);
  return key;
};

export const clearStore = async () => {
  const db = await getDB();
  await db.clear(KEY_STORE_NAME);
};
