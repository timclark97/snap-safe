import { useState } from "react";

import type { PhotosWithObjectUrl } from "@/routes/albums.$id";
import type { OnDownload } from "./EncryptedPhoto";
import { EncryptedPhoto } from "./EncryptedPhoto";
import PhotosModal from "./PhotoModal";

export default function PhotoGrid({
  photos,
  onDownload
}: {
  photos: PhotosWithObjectUrl[];
  onDownload: OnDownload;
}) {
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  return (
    <>
      <PhotosModal
        photos={photos}
        setIsOpen={setPhotoModalOpen}
        isOpen={photoModalOpen}
        index={currentIndex}
      />
      <div className="md:px-8 px-2 grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 cursor-pointer z-0">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="rounded-md overflow-hidden aspect-square hover:scale-[102%] transition-transform duration-300"
            onClick={() => {
              setCurrentIndex(i);
              setPhotoModalOpen(true);
            }}
          >
            <EncryptedPhoto photo={photo} onDownload={onDownload} />
          </div>
        ))}
      </div>
    </>
  );
}
