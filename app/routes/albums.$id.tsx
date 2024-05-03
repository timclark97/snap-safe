import { useEffect, useState } from "react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRouteError, useRevalidator, Outlet } from "@remix-run/react";

import { requireSession } from "@/lib/services/session-service";
import { Alert } from "@/components/common";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";
import { storeKey, getKey, getMasterKey } from "@/lib/services/keydb-service";
import { useSelf } from "@/lib/contexts/self-context";
import { unwrapAlbumKey } from "@/lib/services/crypto-service";
import { getAlbumDetails } from "@/lib/services/album-service";
import { listPhotos } from "@/lib/services/photo-service";
import PhotoGrid from "@/components/album-details/PhotoGrid";
import AlbumHeader from "@/components/album-details/AlbumHeader";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  const albumId = params.id as string;
  const result = await getAlbumDetails(session.user.id, albumId);
  const photos = await listPhotos(albumId);
  return json({ ...result, photos });
}

export type PhotosWithObjectUrl = {
  objectUrl?: string;
  id: string;
  iv: string;
  albumId: string;
  createdOn: string;
};

export default function Album() {
  const { album, photos, key, permission } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const self = useSelf();

  const [photosWithObjectUrls, setPhotosWithObjectUrls] = useState<PhotosWithObjectUrl[]>(
    []
  );
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  const setAlbumKey = async () => {
    const existingKey = await getKey(album.id, self.id);
    if (existingKey) {
      return;
    }

    const masterKey = await getMasterKey(self.id);
    const albumKey = await unwrapAlbumKey(key.key, key.iv, masterKey!);
    await storeKey(albumKey, album.id, self.id);
  };

  useEffect(() => {
    setPhotosWithObjectUrls((prev) => {
      return photos.map((photo) => {
        const existingPhoto = prev.find((p) => p.id === photo.id);
        return existingPhoto || photo;
      });
    });
  }, [photos]);

  useEffect(() => {
    setAlbumKey();
  }, []);

  return (
    <div>
      <Outlet context={{ album, user: self }} />
      <AlbumHeader
        album={album}
        permission={permission}
        uploadCallback={() => {
          if (revalidator.state === "idle") {
            revalidator.revalidate();
          }
        }}
      />
      <PhotoGrid
        photos={photosWithObjectUrls}
        onDownload={({ objectUrl, id }) => {
          setPhotosWithObjectUrls((prev) => {
            return prev.map((photo) => {
              if (photo.id === id) {
                return { ...photo, objectUrl };
              }
              return photo;
            });
          });
        }}
      />
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div className="m-auto mt-4 max-w-md">
      <Alert variant="error" header="Something went wrong">
        {getErrorBoundaryMessage(error)}
      </Alert>
    </div>
  );
}
