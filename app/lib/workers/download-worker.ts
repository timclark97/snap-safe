import { getKey } from "../services/keydb-service";
import { base64ToArray } from "../helpers/binary-helpers";

onmessage = async (event: {
  data: {
    id: string;
    iv: string;
    userId: string;
    albumId: string;
  };
}) => {
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

  const urlFetch = await fetch(`/albums/${data.albumId}/download-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ photoId: data.id })
  });

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
