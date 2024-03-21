import { useEffect } from "react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import {
  useRouteError,
  Link,
  useOutletContext,
  useFetcher
} from "@remix-run/react";
import { XMarkIcon } from "@heroicons/react/24/solid";

import { getAlbumAccess } from "@/lib/services/album-service";
import { requireSession } from "@/lib/services/session-service";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";
import { getUserByEmail } from "@/lib/services/user-service";
import { getKey } from "@/lib/services/keydb-service";
import { importPubKey } from "@/lib/services/crypto-service";
import { Alert, Button, Input } from "@/components/common";
import { useSelf } from "@/lib/hooks/useSelf";
import { bufferToBase64 } from "@/lib/helpers/binary-helpers";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  const albumId = params.id as string;

  const access = await getAlbumAccess(session.userId, albumId);
  if (!access || access.permission.permission !== "owner") {
    throw json(
      { error: "You do not have permission to share this album" },
      {
        status: 403
      }
    );
  }

  const email = new URL(request.url).searchParams.get("email") as string;
  if (!email) {
    return null;
  }
  const user = await getUserByEmail(email);
  if (!user) {
    throw json(
      { error: "User not found" },
      {
        status: 400
      }
    );
  }

  return json({ firstName: user.firstName, puK: user.puK });
}

export default function Album() {
  const { album } = useOutletContext<{ album: { id: string } }>();
  const fetcher = useFetcher<typeof loader>();
  const user = useSelf();

  const shareKey = async () => {
    if (fetcher.data?.puK) {
      const albumKey = await getKey(album.id, user.id);
      if (!albumKey) {
        console.log("No album key found");
        return;
      }
      const puKRaw = fetcher.data.puK;
      const puKey = await importPubKey(puKRaw);

      const sharedKey = await crypto.subtle.wrapKey("raw", albumKey, puKey, {
        name: "RSA-OAEP"
      });
      console.log(bufferToBase64(sharedKey));
    }
  };

  useEffect(() => {
    if (fetcher.data?.puK && fetcher.state === "idle") {
      shareKey();
    }
  }, [fetcher]);

  return (
    <div className="fixed top-14 bottom-0 left-0 right-0 bg-gray-200/50 z-20">
      <div className="bg-white p-4 md:max-w-sm m-auto md:mt-10 rounded-md border">
        <div className="flex justify-between">
          <div className="text-center text-2xl font-medium">Share Album</div>
          <Link to={`/dash/albums/${album.id}`}>
            <XMarkIcon className="w-6 h-6" />
          </Link>
        </div>
        <fetcher.Form>
          <fieldset className="grid gap-4 pt-4">
            <Input
              value="test1@test.com"
              readOnly
              name="email"
              placeholder="Enter the email of who you want to share it with"
              label="Email"
              type="email"
              required
            />
            <Button type="submit">Share</Button>
          </fieldset>
        </fetcher.Form>
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
