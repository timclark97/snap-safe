import { getKey } from "../services/keydb-service";
import { createIv } from "../services/crypto-service";
import { arrayToBase64 } from "../helpers/binary-helpers";

onmessage = async (event: {
  data: {
    id: string;
    albumId: string;
    userId: string;
    file: File;
  };
}) => {
  postMessage({
    id: event.data.id,
    state: "preparing"
  });

  const data = event.data;
  if (!data.id || !data.albumId || !data.userId || !data.file) {
    postMessage({
      id: data.id,
      error: "Missing required fields",
      state: "error"
    });
    return;
  }
  if (data.file.size > 1024 * 1024 * 10) {
    postMessage({
      id: data.id,
      error: "File is too large",
      state: "error"
    });
    return;
  }

  const key = await getKey(data.albumId, data.userId);
  if (!key) {
    postMessage({
      id: data.id,
      error: "You don't have permission to upload to this album",
      state: "error"
    });
    return;
  }

  postMessage({
    id: data.id,
    state: "encrypting"
  });

  const iv = createIv();
  const encryptedFile = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    await data.file.arrayBuffer()
  );

  postMessage({
    id: data.id,
    state: "preparing_upload"
  });

  const resp = await fetch(`/dash/albums/${data.albumId}/create-upload-url`, {
    method: "POST",
    body: JSON.stringify({ photoId: data.id })
  });

  if (!resp.ok) {
    postMessage({
      id: data.id,
      error: "Failed to create upload request",
      state: "error"
    });
    return;
  }

  const { url } = await resp.json();

  postMessage({
    id: data.id,
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
    postMessage({
      id: data.id,
      error: "Failed to upload file",
      state: "error"
    });
    return;
  }

  postMessage({
    id: data.id,
    state: "storing"
  });

  const storeRequest = await fetch(`/dash/albums/${data.albumId}/photo`, {
    method: "POST",
    body: JSON.stringify({ photoId: data.id, iv: arrayToBase64(iv) })
  });

  if (!storeRequest.ok) {
    postMessage({
      id: data.id,
      error: "Failed to store photo",
      state: "error"
    });
    return;
  }

  postMessage({
    id: data.id,
    state: "done"
  });
  return;
};
