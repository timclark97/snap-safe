import { useEffect, useState } from "react";
import { Link, useFetcher } from "@remix-run/react";

import { loader } from "../../routes/albums.$id.share";
import { bufferToBase64 } from "@/lib/helpers/binary-helpers.js";
import { unwrapAlbumKey, importPubKey } from "@/lib/services/crypto-service";
import { getMasterKey, storeKey, getKey } from "@/lib/services/keydb-service";
import { useSelf } from "@/lib/contexts/self-context";
import { Input, Button, Alert } from "../common";

export default function ShareAlbumForm({
  album,
  rawKey
}: {
  album: { id: string };
  rawKey: {
    key: string;
    iv: string;
  };
}) {
  const fetcher = useFetcher<typeof loader>();
  const [isLoading, setIsLoading] = useState(false);
  const user = useSelf();

  const shareKey = async () => {
    try {
      if (fetcher.data?.puK) {
        setIsLoading(true);
        let albumKey: CryptoKey | undefined;
        albumKey = await getKey(album.id, user.id);
        if (!albumKey) {
          const mk = await getMasterKey(user.id);
          albumKey = await unwrapAlbumKey(rawKey.key, rawKey.iv, mk!);
          storeKey(albumKey, album.id, user.id);
        }

        const puKey = await importPubKey(fetcher.data.puK);

        const sharedKey = await crypto.subtle.wrapKey("raw", albumKey, puKey, {
          name: "RSA-OAEP"
        });
        const fd = new FormData();
        fd.append("key", bufferToBase64(sharedKey));
        fd.append("email", fetcher.data.email);
        fd.append("grantedPermission", fetcher.data.grantedPermission);

        fetcher.submit(fd, { method: "POST" });
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fetcher.data?.puK && fetcher.state === "idle") {
      shareKey();
    }
  }, [fetcher]);
  return (
    <div>
      {!fetcher.data?.shared ? (
        <fetcher.Form>
          <fieldset
            className="grid gap-4"
            disabled={fetcher.state === "submitting" || isLoading}
          >
            <Input name="email" label="Email" type="email" required />
            <div>
              <label className="text-base font-semibold text-gray-900">Permission</label>

              <fieldset className="mt-2" name="permission">
                <div className="space-y-2">
                  {[
                    { id: "read", title: "View only" },
                    { id: "write", title: "View and upload" }
                  ].map((notificationMethod) => (
                    <div key={notificationMethod.id} className="flex items-center">
                      <input
                        id={notificationMethod.id}
                        name="grantedPermission"
                        type="radio"
                        value={notificationMethod.id}
                        defaultChecked={notificationMethod.id === "read"}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor={notificationMethod.id}
                        className="ml-3 block text-sm font-medium leading-6 text-gray-900"
                      >
                        {notificationMethod.title}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
            <Button
              type="submit"
              isLoading={fetcher.state === "submitting" || isLoading}
              className="mt-2"
            >
              Share
            </Button>
          </fieldset>
        </fetcher.Form>
      ) : (
        <Alert variant="success">
          <p>An invitation email has been sent.</p>
          <Link className="underline" to={`/albums/${album.id}`}>
            Go back to album
          </Link>{" "}
          or{" "}
          <button
            className="underline"
            onClick={() => {
              fetcher.load("/");
              setIsLoading(false);
            }}
          >
            Invite someone else
          </button>
        </Alert>
      )}
    </div>
  );
}
