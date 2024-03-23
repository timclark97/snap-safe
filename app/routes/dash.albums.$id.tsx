import { useEffect } from "react";
import { ArrowUpTrayIcon, ShareIcon } from "@heroicons/react/24/outline";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import {
  useLoaderData,
  useRouteError,
  useRevalidator,
  Outlet
} from "@remix-run/react";

import { requireSession } from "@/lib/services/session-service";
import { Alert, LinkButton } from "@/components/common";
import { colors, sizes } from "@/components/common/Button";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";
import { EncryptedPhoto } from "@/components/EncryptedPhoto";
import { storeKey, getKey, getMasterKey } from "@/lib/services/keydb-service";
import { useSelf } from "@/lib/contexts/self-context";
import { useUpload } from "@/lib/contexts/upload-context";
import { unwrapAlbumKey } from "@/lib/services/crypto-service";
import { getAlbumDetails } from "@/lib/services/album-service";
import { listPhotos } from "@/lib/services/photo-service";

import { generateId } from "@/lib/helpers/id-generator";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  const albumId = params.id as string;
  const result = await getAlbumDetails(session.user.id, albumId);
  const photos = await listPhotos(albumId);
  return json({ ...result, photos });
}

export default function Album() {
  const { album, photos, key, permission } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const self = useSelf();
  const { enqueueUpload } = useUpload();

  const setAlbumKey = async () => {
    const existingKey = await getKey(album.id, self.id);
    if (existingKey) {
      return;
    }

    const masterKey = await getMasterKey(self.id);
    const albumKey = await unwrapAlbumKey(key.key, key.iv, masterKey);
    await storeKey(albumKey, album.id, self.id);
  };

  useEffect(() => {
    setAlbumKey();
  }, []);

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const id = generateId();
      enqueueUpload({
        id,
        file,
        albumId: album.id,
        onSuccess: ({ albumId }) => {
          if (albumId === album.id && revalidator.state === "idle") {
            revalidator.revalidate();
          }
        }
      });
    }
  };

  return (
    <div>
      <Outlet context={{ album, user: self }} />
      <div className="text-2xl font-medium justify-between items-center flex">
        <h1>{album.name}</h1>
        <div className="flex gap-2 items-center">
          {permission.permission === "owner" && (
            <LinkButton to={`/dash/albums/${album.id}/share`}>
              <ShareIcon className="h-4 w-4" />
            </LinkButton>
          )}
          {(permission.permission == "write" ||
            permission.permission === "owner") && (
            <div>
              <label
                htmlFor="files"
                className={`${colors.primary} ${sizes.base} flex items-center font-medium text-sm cursor-pointer rounded-md`}
              >
                Upload
                <ArrowUpTrayIcon className="h-4 w-4 inline-block ml-2 stroke-2" />
              </label>

              <input
                type="file"
                id="files"
                className="sr-only"
                multiple
                accept="image/jpeg,image/png,image/webp/,image/gif"
                onChange={onFileSelect}
              />
            </div>
          )}
        </div>
      </div>
      <div className="grid mt-4 gap-5 sm:grid-cols-3 grid-cols-2 lg:grid-cols-4">
        {photos.map((photo) => (
          <EncryptedPhoto
            photo={photo}
            key={photo.id}
            onDelete={() => {
              if (revalidator.state === "idle") {
                revalidator.revalidate();
              }
            }}
          />
        ))}
      </div>
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
