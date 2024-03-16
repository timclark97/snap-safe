import { useState, useEffect } from "react";
import { type ActionFunctionArgs, json } from "@remix-run/node";
import { useFetcher, useNavigate } from "@remix-run/react";

import { sqlite, albumKeys, albums, albumPermissions } from "@/lib/sqlite";
import { FormCard, Input, Button, Alert } from "@/components/common";
import { createAlbumKey } from "@/lib/services/crypto-service";
import { createIv } from "@/lib/services/crypto-service";
import { useSelf } from "@/lib/hooks/useSelf";
import { getKey, storeKey } from "@/lib/services/keydb-service";
import { arrayToBase64, bufferToBase64 } from "@/lib/helpers/binary-helpers";
import { requireSession } from "@/lib/services/session-service";

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireSession(request);

  const body = await request.formData();
  const albumName = body.get("albumName") as string;
  const albumDescription = body.get("albumDescription") as string;
  const iv = body.get("iv") as string;
  const key = body.get("key") as string;

  const { albumId, albumKeyId } = await sqlite.transaction(async (db) => {
    const [album] = await db
      .insert(albums)
      .values({
        userId: session.userId,
        name: albumName,
        description: albumDescription
      })
      .returning()
      .execute();

    const [albumKey] = await db
      .insert(albumKeys)
      .values({
        userId: session.userId,
        albumId: album.id,
        key,
        iv
      })
      .returning()
      .execute();

    await db
      .insert(albumPermissions)
      .values({
        userId: session.userId,
        albumId: album.id,
        permission: "owner",
        grantedBy: session.userId
      })
      .execute();

    return { albumId: album.id, albumKeyId: albumKey.id };
  });

  return json({ albumId, albumKeyId });
}

export default function DashAlbumCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [albumKey, setAlbumKey] = useState<CryptoKey | null>(null);
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const { id } = useSelf();

  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      fetcher.data.albumId &&
      fetcher.data.albumKeyId &&
      albumKey
    ) {
      storeKey(albumKey, fetcher.data.albumId, id).then(() => {
        setAlbumKey(null);
        navigate(`/dash/albums/${fetcher.data!.albumId}`);
      });
    }
  }, [fetcher, albumKey]);

  return (
    <div>
      <FormCard header="Create Album">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setIsLoading(true);
              const fd = new FormData(e.currentTarget);
              const albumName = fd.get("name") as string;
              const albumDescription = fd.get("description") as string;
              const key = await createAlbumKey();
              const mk = await getKey(id, id);

              if (!mk) {
                setError("Unable to create album.");
                setIsLoading(false);
                return;
              }

              const akIv = createIv();
              const wrappedKey = await window.crypto.subtle.wrapKey(
                "raw",
                key,
                mk,
                {
                  name: "AES-GCM",
                  iv: akIv
                }
              );

              setAlbumKey(key);
              const body = new FormData();
              body.append("albumName", albumName);
              body.append("albumDescription", albumDescription);
              body.append("iv", arrayToBase64(akIv));
              body.append("key", bufferToBase64(wrappedKey));
              fetcher.submit(body, { method: "POST" });
              setIsLoading(false);
            } catch (e: unknown) {
              setIsLoading(false);
              if (e instanceof Error) {
                setError(e.message);
                return;
              }
              setError("An unknown error occurred.");
            }
          }}
        >
          <fieldset className="grid gap-8" disabled={isLoading}>
            <Alert variant="error" dismissible>
              {error}
            </Alert>
            <Input label="Name" name="name" required />
            <Input label="Description" name="description" />
            <Button type="submit" isLoading={isLoading}>
              Create
            </Button>
          </fieldset>
        </form>
      </FormCard>
    </div>
  );
}
