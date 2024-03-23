import { useEffect, useState } from "react";
import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import {
  useRouteError,
  Link,
  useLoaderData,
  useFetcher
} from "@remix-run/react";
import { XMarkIcon } from "@heroicons/react/24/solid";

import { getAlbumDetails, shareAlbum } from "@/lib/services/album-service";
import {
  shareAlbumActionValidator,
  shareAlbumLoadValidator
} from "@/lib/validators/album-validators";
import { requireSession } from "@/lib/services/session-service";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";
import { getUserByEmail } from "@/lib/services/user-service";
import { getKey, storeKey, getMasterKey } from "@/lib/services/keydb-service";
import { importPubKey, unwrapAlbumKey } from "@/lib/services/crypto-service";
import { Alert, Button, Input, FormCard } from "@/components/common";
import { useSelf } from "@/lib/contexts/self-context";
import { bufferToBase64 } from "@/lib/helpers/binary-helpers";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  const albumId = params.id as string;
  const validator = shareAlbumLoadValidator(new URL(request.url).searchParams);
  if (!validator.success) {
    throw json("Invalid request", { status: 400 });
  }

  const album = await getAlbumDetails(session.userId, albumId);

  if (album.permission.permission !== "owner") {
    throw json(
      { error: "You do not have permission to share this album" },
      {
        status: 403
      }
    );
  }

  if (!validator.data.email || !validator.data.grantedPermission) {
    return json({
      puK: "",
      grantedPermission: "",
      email: "",
      shared: false,
      ...album
    });
  }

  const user = await getUserByEmail(validator.data.email);
  if (!user || user.id === session.userId) {
    throw json(
      { error: "User not found" },
      {
        status: 400
      }
    );
  }

  return json({
    puK: user.puK,
    email: validator.data.email,
    grantedPermission: validator.data.grantedPermission,
    shared: false,
    ...album
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const session = await requireSession(request);
  const albumId = params.id as string;
  const validator = shareAlbumActionValidator(await request.formData());
  if (!validator.success) {
    return json("Invalid request", { status: 400 });
  }
  const { email, grantedPermission, key } = validator.data;

  await shareAlbum({
    userId: session.userId,
    albumId,
    email,
    wrappedKey: key,
    permission: grantedPermission
  });
  return json({ shared: true });
}

export default function Album() {
  const fetcher = useFetcher<typeof loader>();
  const { album, key } = useLoaderData<typeof loader>();
  const [isLoading, setIsLoading] = useState(false);
  const user = useSelf();

  const shareKey = async () => {
    if (fetcher.data?.puK) {
      setIsLoading(true);
      let albumKey: CryptoKey | undefined;
      albumKey = await getKey(album.id, user.id);
      if (!albumKey) {
        const mk = await getMasterKey(user.id);
        albumKey = await unwrapAlbumKey(key.key, key.iv, mk);
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
  };

  useEffect(() => {
    if (fetcher.data?.puK && fetcher.state === "idle") {
      shareKey();
    }
  }, [fetcher]);

  return (
    <div>
      <FormCard
        header="Share Your Album"
        subHeader="Enter the email of who you want to share with. If they don't have an account, you will need to send them an invitation."
      >
        {!fetcher.data?.shared ? (
          <fetcher.Form>
            <fieldset
              className="grid gap-4"
              disabled={fetcher.state === "submitting" || isLoading}
            >
              <Input name="email" label="Email" type="email" required />
              <div>
                <label className="text-base font-semibold text-gray-900">
                  Permission
                </label>

                <fieldset className="mt-2" name="permission">
                  <div className="space-y-2">
                    {[
                      { id: "read", title: "View only" },
                      { id: "write", title: "View and upload" }
                    ].map((notificationMethod) => (
                      <div
                        key={notificationMethod.id}
                        className="flex items-center"
                      >
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
                Search
              </Button>
            </fieldset>
          </fetcher.Form>
        ) : (
          <Alert variant="success">
            <p>An invitation email has been sent.</p>
            <Link className="underline" to={`/dash/albums/${album.id}`}>
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
      </FormCard>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <FormCard
      header="Share Your Album"
      subHeader="Enter the email of who you want to share with. If they don't have an account, you will need to send them an invitation."
    >
      <Alert variant="warning" revalidateable>
        {getErrorBoundaryMessage(error)}
      </Alert>
    </FormCard>
  );
}
