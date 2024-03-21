import { useEffect, useState } from "react";

import { useSelf } from "@/lib/hooks/useSelf";

export function EncryptedPhoto({
  photo
}: {
  photo: { id: string; albumId: string; iv: string };
}) {
  const [state, setState] = useState("preparing");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const self = useSelf();

  const downloadPhoto = () => {
    if (photoUrl) {
      return;
    }
    const worker = new Worker("/workers/download-worker.js");
    worker.postMessage({
      id: photo.id,
      albumId: photo.albumId,
      iv: photo.iv,
      userId: self.id
    });
    worker.onmessage = (event) => {
      setState(event.data.state);
      if (event.data.state === "done") {
        setPhotoUrl(event.data.url);
      }
    };
  };

  const deletePhoto = async () => {
    const resp = await fetch(
      `/dash/albums/${photo.albumId}/photos/${photo.id}`,
      {
        method: "DELETE"
      }
    );

    if (resp.ok) {
      setPhotoUrl(null);
    }
  };

  useEffect(() => {
    downloadPhoto();
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photo.id]);

  return (
    <div className="overflow-hidden cursor-pointer aspect-square">
      {state === "done" && photoUrl && (
        <div className="relative rounded-md overflow-hidden">
          <button
            className="absolute top-0 right-2 z-10"
            onClick={() => deletePhoto()}
          >
            D
          </button>
          <img
            src={photoUrl}
            alt={photo.id}
            className="object-fill aspect-square w-full h-full hover:scale-110 transition-transform z-0"
          />
        </div>
      )}
      {state !== "error" && state !== "done" && (
        <div className="animate-pulse bg-gray-200 h-full w-full rounded-md" />
      )}
    </div>
  );
}
