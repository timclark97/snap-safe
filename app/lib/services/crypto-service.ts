/* eslint-disable import/exports-last */
import { base64ToArray, bufferToBase64 } from "@/lib/helpers/binary-helpers";

type SaltType = ArrayBuffer | Uint8Array | string;

/**
 *
 * @see [crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
 */
export const createSalt = () => crypto.getRandomValues(new Uint8Array(32));

/**
 *
 * Creates a 12 byte random Typed array. For use with AES-GCM
 * @see [crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
 */
export const createIv = () => crypto.getRandomValues(new Uint8Array(12));

let dbKey: CryptoKey | undefined;

export const getDbKey = async (userId: string) => {
  if (dbKey) {
    return dbKey;
  }

  const wrappingKeyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(navigator.userAgent + userId),
    { name: "PBKDF2" },
    false,
    ["deriveKey", "deriveBits"]
  );

  dbKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(userId),
      iterations: 600000,
      hash: "SHA-256"
    },
    wrappingKeyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["unwrapKey", "wrapKey"]
  );

  return dbKey!;
};

/**
 *
 * [PBKD2 info](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey#pbkdf2)
 * [PBKD2 params](https://developer.mozilla.org/en-US/docs/Web/API/Pbkdf2Params).
 * [MDN derive key example](https://github.com/mdn/dom-examples/blob/main/web-crypto/wrap-key/raw.js).
 */
export const deriveMK = async (
  userId: string,
  password: string,
  salt: SaltType
) => {
  const wrappingKeyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.trim().normalize() + userId),
    { name: "PBKDF2" },
    false,
    ["deriveKey", "deriveBits"]
  );

  let saltArray: ArrayBuffer | Uint8Array;
  if (typeof salt === "string") {
    saltArray = base64ToArray(salt);
  } else {
    saltArray = salt;
  }

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltArray,
      iterations: 210000,
      hash: "SHA-256"
    },
    wrappingKeyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["unwrapKey", "wrapKey", "encrypt", "decrypt"]
  );
};

export const createKeyPair = async () => {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );
};

export const importPriKey = async (keyData: string) => {
  let jsonKey: JsonWebKey;
  try {
    jsonKey = JSON.parse(keyData) as JsonWebKey;
  } catch (e) {
    throw new Error("Invalid key");
  }
  return await crypto.subtle.importKey(
    "jwk",
    jsonKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
};

export const importPubKey = async (keyData: string) => {
  let jsonKey: JsonWebKey;
  try {
    jsonKey = JSON.parse(keyData) as JsonWebKey;
  } catch (e) {
    throw new Error("Invalid public key data");
  }

  try {
    return await crypto.subtle.importKey(
      "jwk",
      jsonKey,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt", "wrapKey"]
    );
  } catch (e: unknown) {
    throw new Error(e instanceof Error ? e.message : "Invalid public key data");
  }
};

export const decryptPriKey = async (
  keyData: string,
  decryptingKey: CryptoKey,
  iv: string
): Promise<{ key?: CryptoKey; error?: string }> => {
  try {
    const decryptedKey = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToArray(iv) },
      decryptingKey,
      base64ToArray(keyData)
    );

    const key = await importPriKey(new TextDecoder().decode(decryptedKey));
    return { key };
  } catch (e) {
    throw new Error("Wrong password");
  }
};

export const createAlbumKey = async () => {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

/**
 * Client side - Create a new master key from a password.
 * The salt is encrypted by the new key to be used later to
 * confirm the key when it is re-derived from the same password
 */
export const initializeMK = async (userId: string, password: string) => {
  const salt = createSalt();
  const key = await deriveMK(userId, password, salt);
  const mktIv = createIv();
  const mkt = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: mktIv
    },
    key,
    salt
  );

  return { salt, key, mktIv, mkt };
};

/**
 * Client side - Creates a new key pair, exports the public key as
 * a JWK and wraps the private key with the master key
 */
export const initializeKeyPair = async (masterKey: CryptoKey) => {
  const keyPair = await createKeyPair();
  const puK = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const prKIv = createIv();
  const prKBuffer = await window.crypto.subtle.wrapKey(
    "pkcs8",
    keyPair.privateKey,
    masterKey,
    {
      name: "AES-GCM",
      iv: prKIv
    }
  );

  return { puK, prKIv, wrappedPrK: bufferToBase64(prKBuffer) };
};

/**
 * Client side - Wraps album key with user's master key
 */
export const wrapAlbumKey = async (
  albumKey: CryptoKey,
  masterKey: CryptoKey
) => {
  const iv = createIv();
  const wrappedKey = await crypto.subtle.wrapKey("raw", albumKey, masterKey, {
    name: "AES-GCM",
    iv
  });
  return { wrappedKey, iv };
};

/**
 * Client side - Unwraps album key with user's master key
 */
export const unwrapAlbumKey = async (
  wrappedKey: string,
  iv: string,
  masterKey: CryptoKey
) => {
  const key = await crypto.subtle.unwrapKey(
    "raw",
    base64ToArray(wrappedKey),
    masterKey,
    {
      name: "AES-GCM",
      iv: base64ToArray(iv)
    },
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
};
