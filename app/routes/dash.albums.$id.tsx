import { useEffect } from "react";
import { ArrowUpTrayIcon, ShareIcon } from "@heroicons/react/24/outline";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRouteError, Outlet } from "@remix-run/react";
import { eq, and } from "drizzle-orm";

import { requireSession } from "@/lib/services/session-service";
import {
  sqlite,
  albums,
  albumPermissions,
  photos,
  albumKeys
} from "@/lib/sqlite";
import { Alert, LinkButton } from "@/components/common";
import { colors, sizes } from "@/components/common/Button";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";
import { useUpload } from "@/lib/hooks/useUpload";
import { EncryptedPhoto } from "@/components/EncryptedPhoto";
import { storeKey, getKey } from "@/lib/services/keydb-service";
import { useSelf } from "@/lib/hooks/useSelf";

import { generateId } from "@/lib/helpers/id-generator";
import { base64ToArray } from "@/lib/helpers/binary-helpers";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await requireSession(request);

  const queryResult = await sqlite
    .select()
    .from(albums)
    .where(eq(albums.id, params.id as string))
    .innerJoin(
      albumPermissions,
      and(
        eq(albumPermissions.albumId, albums.id),
        eq(albumPermissions.userId, session.userId)
      )
    )
    .innerJoin(
      albumKeys,
      and(
        eq(albumKeys.albumId, albums.id),
        eq(albumKeys.userId, session.userId)
      )
    )
    .execute();

  if (queryResult.length === 0) {
    throw json({ message: "Album not found" }, { status: 404 });
  }

  const [result] = queryResult;

  const albumPhotos = await sqlite
    .select()
    .from(photos)
    .where(eq(photos.albumId, result.albums.id))
    .limit(50)
    .execute();

  return json({
    album: result.albums,
    permission: result.album_permissions,
    photos: albumPhotos,
    key: result.album_keys
  });
}

export default function Album() {
  const { album, photos, key, permission } = useLoaderData<typeof loader>();
  const self = useSelf();
  const { enqueuePhoto } = useUpload();

  const setAlbumKey = async () => {
    const existingKey = await getKey(album.id, self.id);

    if (existingKey) {
      return;
    }
    console.log("No existing key");

    const masterKey = await getKey(self.id, self.id);
    if (!masterKey) {
      console.log("Master key not found");
      return;
    }

    try {
      const albumKey = await crypto.subtle.unwrapKey(
        "raw",
        base64ToArray(key.key),
        masterKey,
        {
          name: "AES-GCM",
          iv: base64ToArray(key.iv)
        },
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
      );
      await storeKey(albumKey, album.id, self.id);
    } catch (e) {
      console.error(e);
      console.log("failed to unwarp and store key");
    }
  };

  useEffect(() => {
    setAlbumKey();
  }, []);

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const id = generateId();
      enqueuePhoto(id, file, album.id);
    }
  };

  return (
    <div>
      <Outlet context={{ album, user: self }} />
      <div className="text-2xl font-medium justify-between items-center flex">
        <h1>{album.name}</h1>
        <div className="flex gap-2">
          {permission.permission === "owner" && (
            <LinkButton size="sm" to={`/dash/albums/${album.id}/share`}>
              <ShareIcon className="h-4 w-4" />
            </LinkButton>
          )}
          {(permission.permission == "write" ||
            permission.permission === "owner") && (
            <div>
              <label
                htmlFor="files"
                className={`${colors.primary} ${sizes.sm} flex items-center font-medium text-sm cursor-pointer rounded-md`}
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
      <div className="grid gap-4 md:grid-cols-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {photos.map((photo) => (
          <EncryptedPhoto photo={photo} key={photo.id} />
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
