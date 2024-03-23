import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@remix-run/react";

import { useSelf } from "@/lib/contexts/self-context";

export function EncryptedPhoto({
  photo,
  onDelete
}: {
  photo: { id: string; albumId: string; iv: string };
  onDelete?: (photoId: string) => void;
}) {
  const [state, setState] = useState("preparing");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const photoRef = useRef(null);
  const self = useSelf();
  const navigate = useNavigate();

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
      if (onDelete) {
        onDelete(photo.id);
      }
    }
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
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
      if (photoRef.current) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <div
      ref={photoRef}
      className="overflow-hidden cursor-pointer aspect-square"
      onClick={() => {
        navigate(`/dash/albums/${photo.albumId}/view?object_url=${photoUrl}`, {
          preventScrollReset: true
        });
      }}
    >
      {state === "done" && photoUrl && (
        <div className="relative rounded-md overflow-hidden">
          <button
            className="absolute top-0 right-2 z-10"
            onClick={(e) => {
              e.stopPropagation();
              deletePhoto();
            }}
          >
            D
          </button>
          <img
            src={photoUrl}
            alt={photo.id}
            className="object-cover aspect-square w-full h-full hover:scale-110 transition-transform z-0"
          />
        </div>
      )}
      {state !== "error" && state !== "done" && (
        <div className="animate-pulse bg-gray-200 h-full w-full rounded-md" />
      )}
    </div>
  );
}
