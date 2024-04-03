import { EncryptedPhoto } from "./EncryptedPhoto";
import type { OnDownload, OnClick } from "./EncryptedPhoto";

export default function PhotoGrid({
  photos,
  onDownload,
  onPhotoClick
}: {
  photos: { id: string; albumId: string; iv: string }[];
  onDownload: OnDownload;
  onPhotoClick?: OnClick;
}) {
  return (
    <div className="grid mt-4 gap-5 sm:grid-cols-3 grid-cols-2 lg:grid-cols-4">
      {photos.map((photo, i) => (
        <EncryptedPhoto
          photo={photo}
          onDownload={onDownload}
          key={photo.id}
          onClick={onPhotoClick}
          index={i}
        />
      ))}
    </div>
  );
}
