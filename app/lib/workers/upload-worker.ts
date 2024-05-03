import { getKey } from "../services/keydb-service";
import { createIv } from "../services/crypto-service";
import { arrayToBase64 } from "../helpers/binary-helpers";

export type UploadWorkerMessageUpdate = {
  id: string;
  albumId: string;
  state:
    | "pending"
    | "preparing"
    | "encrypting"
    | "preparing_upload"
    | "uploading"
    | "storing";
};

export type UploadWorkerMessageError = {
  id: string;
  albumId: string;
  error: string;
  state: "error";
};

export type UploadWorkerMessageSuccess = {
  id: string;
  albumId: string;
  state: "done";
};

export type UploadWorkerMessage =
  | UploadWorkerMessageUpdate
  | UploadWorkerMessageError
  | UploadWorkerMessageSuccess;

const sendMessage = (message: UploadWorkerMessage) => {
  postMessage(message);
};

onmessage = async (event: {
  data: {
    id: string;
    albumId: string;
    userId: string;
    file: File;
  };
}) => {
  sendMessage({
    id: event.data.id,
    albumId: event.data.albumId,
    state: "preparing"
  });

  const data = event.data;
  if (!data.id || !data.albumId || !data.userId || !data.file) {
    sendMessage({
      id: data.id,
      albumId: event.data.albumId,
      error: "Missing required fields",
      state: "error"
    });
    return;
  }
  if (data.file.size > 1024 * 1024 * 10) {
    sendMessage({
      id: data.id,
      albumId: event.data.albumId,
      error: "File is too large",
      state: "error"
    });
    return;
  }

  const key = await getKey(data.albumId, data.userId);
  if (!key) {
    sendMessage({
      id: data.id,
      albumId: event.data.albumId,
      error: "You don't have permission to upload to this album",
      state: "error"
    });
    return;
  }

  sendMessage({
    id: data.id,
    albumId: event.data.albumId,
    state: "encrypting"
  });

  const iv = createIv();
  const encryptedFile = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    await data.file.arrayBuffer()
  );

  sendMessage({
    id: data.id,
    albumId: event.data.albumId,
    state: "preparing_upload"
  });

  const resp = await fetch(`/albums/${data.albumId}/upload-url`, {
    method: "POST",
    body: JSON.stringify({ photoId: data.id, contentLength: encryptedFile.byteLength })
  });

  if (!resp.ok) {
    sendMessage({
      id: data.id,
      albumId: event.data.albumId,
      error: "Failed to create upload request",
      state: "error"
    });
    return;
  }

  const { url } = await resp.json();

  sendMessage({
    id: data.id,
    albumId: event.data.albumId,
    state: "uploading"
  });

  const uploadResp = await fetch(url, {
    method: "PUT",
    body: new Blob([encryptedFile], { type: "application/octet-stream" }),
    headers: {
      "Content-Type": "application/octet-stream"
    }
  });

  if (!uploadResp.ok) {
    sendMessage({
      id: data.id,
      albumId: event.data.albumId,
      error: "Failed to upload file",
      state: "error"
    });
    return;
  }

  sendMessage({
    id: data.id,
    albumId: event.data.albumId,
    state: "storing"
  });

  const storeRequest = await fetch(`/albums/${data.albumId}/photo`, {
    method: "POST",
    body: JSON.stringify({ photoId: data.id, iv: arrayToBase64(iv) })
  });

  if (!storeRequest.ok) {
    sendMessage({
      id: data.id,
      albumId: event.data.albumId,
      error: "Failed to store photo",
      state: "error"
    });
    return;
  }

  sendMessage({
    id: data.id,
    albumId: event.data.albumId,
    state: "done"
  });

  return;
};
