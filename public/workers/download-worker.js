"use strict";
(() => {
  // node_modules/idb/build/index.js
  var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
  var idbProxyableTypes;
  var cursorAdvanceMethods;
  function getIdbProxyableTypes() {
    return idbProxyableTypes || (idbProxyableTypes = [
      IDBDatabase,
      IDBObjectStore,
      IDBIndex,
      IDBCursor,
      IDBTransaction
    ]);
  }
  function getCursorAdvanceMethods() {
    return cursorAdvanceMethods || (cursorAdvanceMethods = [
      IDBCursor.prototype.advance,
      IDBCursor.prototype.continue,
      IDBCursor.prototype.continuePrimaryKey
    ]);
  }
  var transactionDoneMap = /* @__PURE__ */ new WeakMap();
  var transformCache = /* @__PURE__ */ new WeakMap();
  var reverseTransformCache = /* @__PURE__ */ new WeakMap();
  function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
      const unlisten = () => {
        request.removeEventListener("success", success);
        request.removeEventListener("error", error);
      };
      const success = () => {
        resolve(wrap(request.result));
        unlisten();
      };
      const error = () => {
        reject(request.error);
        unlisten();
      };
      request.addEventListener("success", success);
      request.addEventListener("error", error);
    });
    reverseTransformCache.set(promise, request);
    return promise;
  }
  function cacheDonePromiseForTransaction(tx) {
    if (transactionDoneMap.has(tx))
      return;
    const done = new Promise((resolve, reject) => {
      const unlisten = () => {
        tx.removeEventListener("complete", complete);
        tx.removeEventListener("error", error);
        tx.removeEventListener("abort", error);
      };
      const complete = () => {
        resolve();
        unlisten();
      };
      const error = () => {
        reject(tx.error || new DOMException("AbortError", "AbortError"));
        unlisten();
      };
      tx.addEventListener("complete", complete);
      tx.addEventListener("error", error);
      tx.addEventListener("abort", error);
    });
    transactionDoneMap.set(tx, done);
  }
  var idbProxyTraps = {
    get(target, prop, receiver) {
      if (target instanceof IDBTransaction) {
        if (prop === "done")
          return transactionDoneMap.get(target);
        if (prop === "store") {
          return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
        }
      }
      return wrap(target[prop]);
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
    has(target, prop) {
      if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
        return true;
      }
      return prop in target;
    }
  };
  function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
  }
  function wrapFunction(func) {
    if (getCursorAdvanceMethods().includes(func)) {
      return function(...args) {
        func.apply(unwrap(this), args);
        return wrap(this.request);
      };
    }
    return function(...args) {
      return wrap(func.apply(unwrap(this), args));
    };
  }
  function transformCachableValue(value) {
    if (typeof value === "function")
      return wrapFunction(value);
    if (value instanceof IDBTransaction)
      cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
      return new Proxy(value, idbProxyTraps);
    return value;
  }
  function wrap(value) {
    if (value instanceof IDBRequest)
      return promisifyRequest(value);
    if (transformCache.has(value))
      return transformCache.get(value);
    const newValue = transformCachableValue(value);
    if (newValue !== value) {
      transformCache.set(value, newValue);
      reverseTransformCache.set(newValue, value);
    }
    return newValue;
  }
  var unwrap = (value) => reverseTransformCache.get(value);
  function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
      request.addEventListener("upgradeneeded", (event) => {
        upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
      });
    }
    if (blocked) {
      request.addEventListener("blocked", (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion,
        event.newVersion,
        event
      ));
    }
    openPromise.then((db) => {
      if (terminated)
        db.addEventListener("close", () => terminated());
      if (blocking) {
        db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
      }
    }).catch(() => {
    });
    return openPromise;
  }
  var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
  var writeMethods = ["put", "add", "delete", "clear"];
  var cachedMethods = /* @__PURE__ */ new Map();
  function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
      return;
    }
    if (cachedMethods.get(prop))
      return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, "");
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
      // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
      !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
    ) {
      return;
    }
    const method = async function(storeName, ...args) {
      const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
      let target2 = tx.store;
      if (useIndex)
        target2 = target2.index(args.shift());
      return (await Promise.all([
        target2[targetFuncName](...args),
        isWrite && tx.done
      ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
  }
  replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
  }));
  var advanceMethodProps = ["continue", "continuePrimaryKey", "advance"];
  var methodMap = {};
  var advanceResults = /* @__PURE__ */ new WeakMap();
  var ittrProxiedCursorToOriginalProxy = /* @__PURE__ */ new WeakMap();
  var cursorIteratorTraps = {
    get(target, prop) {
      if (!advanceMethodProps.includes(prop))
        return target[prop];
      let cachedFunc = methodMap[prop];
      if (!cachedFunc) {
        cachedFunc = methodMap[prop] = function(...args) {
          advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
        };
      }
      return cachedFunc;
    }
  };
  async function* iterate(...args) {
    let cursor = this;
    if (!(cursor instanceof IDBCursor)) {
      cursor = await cursor.openCursor(...args);
    }
    if (!cursor)
      return;
    cursor = cursor;
    const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
    ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
    reverseTransformCache.set(proxiedCursor, unwrap(cursor));
    while (cursor) {
      yield proxiedCursor;
      cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
      advanceResults.delete(proxiedCursor);
    }
  }
  function isIteratorProp(target, prop) {
    return prop === Symbol.asyncIterator && instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor]) || prop === "iterate" && instanceOfAny(target, [IDBIndex, IDBObjectStore]);
  }
  replaceTraps((oldTraps) => ({
    ...oldTraps,
    get(target, prop, receiver) {
      if (isIteratorProp(target, prop))
        return iterate;
      return oldTraps.get(target, prop, receiver);
    },
    has(target, prop) {
      return isIteratorProp(target, prop) || oldTraps.has(target, prop);
    }
  }));

  // app/lib/helpers/binary-helpers.ts
  var base64ToArray = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // app/lib/services/crypto-service.ts
  var dbKey;
  var getDbKey = async (userId) => {
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
        iterations: 6e5,
        hash: "SHA-256"
      },
      wrappingKeyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["unwrapKey", "wrapKey"]
    );
    if (!dbKey) {
      throw new Error("Failed to get dbKey not found");
    }
    return dbKey;
  };

  // app/lib/services/keydb-service.ts
  var keyDb;
  var getDB = async () => {
    if (keyDb) {
      return keyDb;
    }
    keyDb = await openDB("kdb", 1, {
      upgrade(db) {
        db.createObjectStore("ak");
      }
    });
    return keyDb;
  };
  var getKey = async (keyId, userId) => {
    const db = await getDB();
    const dbKey2 = await getDbKey(userId);
    const keyData = await db.get("ak", keyId);
    if (!keyData) {
      return;
    }
    if (keyData.setOn < new Date((/* @__PURE__ */ new Date()).getDate() + 14).getTime()) {
      await db.delete("ak", keyId);
      return;
    }
    try {
      const key = await crypto.subtle.unwrapKey(
        "raw",
        base64ToArray(keyData.data),
        dbKey2,
        {
          name: "AES-GCM",
          iv: new TextEncoder().encode(keyId + userId)
        },
        { name: "AES-GCM" },
        true,
        keyData.usages
      );
      return key;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Failed to unwrap key:", e.message);
      }
      console.error(e);
    }
  };

  // app/lib/workers/download-worker.ts
  onmessage = async (event) => {
    postMessage({
      id: event.data.id,
      state: "preparing"
    });
    const data = event.data;
    if (!data.id || !data.albumId || !data.userId) {
      postMessage({
        id: data.id,
        error: "Missing required fields",
        state: "error"
      });
      return;
    }
    const key = await getKey(data.albumId, data.userId);
    if (!key) {
      postMessage({
        id: data.id,
        error: "You don't have permission to view this photo",
        state: "error"
      });
      return;
    }
    postMessage({
      id: data.id,
      state: "preparing_download"
    });
    const urlFetch = await fetch(
      `/dash/albums/${data.albumId}/create-download-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ photoId: data.id })
      }
    );
    if (!urlFetch.ok) {
      postMessage({
        id: data.id,
        error: "Failed to create download url",
        state: "error"
      });
      return;
    }
    const { url } = await urlFetch.json();
    postMessage({
      id: data.id,
      state: "downloading"
    });
    const encryptedPhoto = await fetch(url, {
      headers: {
        "Content-Type": "application/octet-stream"
      }
    });
    if (!encryptedPhoto.ok) {
      postMessage({
        id: data.id,
        error: "Failed to download photo",
        state: "error"
      });
      return;
    }
    const encryptedPhotoBuffer = await encryptedPhoto.arrayBuffer();
    postMessage({
      id: data.id,
      state: "decrypting"
    });
    const decryptedPhoto = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToArray(data.iv)
      },
      key,
      encryptedPhotoBuffer
    );
    const decryptedPhotoBlob = new Blob([decryptedPhoto]);
    postMessage({
      id: data.id,
      url: URL.createObjectURL(decryptedPhotoBlob),
      state: "done"
    });
    return;
  };
})();
