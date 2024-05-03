import { useEffect, useState, useRef } from "react";

import { useSelf } from "@/lib/contexts/self-context";
import { getKey } from "@/lib/services/keydb-service";
import { base64ToArray } from "@/lib/helpers/binary-helpers";

export type OnDownload = (args: { objectUrl: string; id: string }) => void;

const photoCache = new Map<string, string>();

export function EncryptedPhoto({
  photo,
  onDownload
}: {
  photo: { id: string; albumId: string; iv: string };
  onDownload?: OnDownload;
  className?: string;
}) {
  const [state, setState] = useState("preparing");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const photoRef = useRef(null);
  const self = useSelf();

  const downloadPhoto = async () => {
    if (photoUrl) {
      setState("done");
      return;
    }

    if (photoCache.has(photo.id)) {
      const url = photoCache.get(photo.id)!;
      setPhotoUrl(url);
      if (onDownload) {
        onDownload({ objectUrl: url, id: photo.id });
      }
      setState("done");
      return;
    }

    const albumId = photo.albumId;
    const key = await getKey(albumId, self.id);
    if (!key) {
      setState("error");
      return;
    }
    const urlFetch = await fetch(`/albums/${albumId}/download-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ photoId: photo.id })
    });

    const { url } = await urlFetch.json();

    const encryptedPhoto = await fetch(url, {
      headers: {
        "Content-Type": "application/octet-stream"
      }
    });

    const encryptedPhotoBuffer = await encryptedPhoto.arrayBuffer();

    const decryptedPhoto = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToArray(photo.iv)
      },
      key,
      encryptedPhotoBuffer
    );

    const decryptedPhotoBlob = new Blob([decryptedPhoto]);
    const objectUrl = URL.createObjectURL(decryptedPhotoBlob);
    if (onDownload) {
      onDownload({ objectUrl, id: photo.id });
    }
    setPhotoUrl(objectUrl);
    photoCache.set(photo.id, objectUrl);
    setState("done");
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          downloadPhoto();
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "10px" }
    );

    if (photoRef.current) {
      observer.observe(photoRef.current);
    }

    return () => {
      if (photoRef.current) {
        observer.disconnect();
      }
    };
  }, [photo]);

  return (
    <div ref={photoRef} className="w-full h-full">
      {state === "done" && photoUrl && (
        <img
          src={photoUrl}
          alt={photo.id}
          className="object-cover w-full bg-gray-200 text-gray-200 h-full"
        />
      )}
      {state !== "error" && state !== "done" && (
        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
          <svg
            className="h-12 w-12 animate-spin text-inherit text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}
    </div>
  );
}
