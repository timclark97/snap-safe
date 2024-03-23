import { useState, useEffect } from "react";
import { ActionFunctionArgs, json } from "@remix-run/node";
import {
  useFetcher,
  useNavigate,
  ShouldRevalidateFunctionArgs,
  useRouteError
} from "@remix-run/react";

import { createAlbumKey, wrapAlbumKey } from "@/lib/services/crypto-service";
import { storeKey, getMasterKey } from "@/lib/services/keydb-service";
import { requireSession } from "@/lib/services/session-service";
import { insertAlbum } from "@/lib/services/album-service";
import { FormCard, Input, Button, Alert } from "@/components/common";
import { arrayToBase64, bufferToBase64 } from "@/lib/helpers/binary-helpers";
import { useSelf } from "@/lib/contexts/self-context";
import { createAlbumValidator } from "@/lib/validators/album-validators";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  if (args.actionResult) {
    return false;
  }
  return args.defaultShouldRevalidate;
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireSession(request);
  const validator = createAlbumValidator(await request.formData());
  if (!validator.success) {
    throw json({ error: "Invalid request. Try again." }, { status: 400 });
  }

  const { albumId, albumKeyId } = await insertAlbum({
    userId: session.userId,
    ...validator.data
  });

  return json({ albumId, albumKeyId });
}

export default function DashAlbumCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [albumKey, setAlbumKey] = useState<CryptoKey | null>(null);
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const user = useSelf();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const albumName = fd.get("name") as string;
      const albumDescription = fd.get("description") as string;
      const mk = await getMasterKey(user.id);
      const key = await createAlbumKey();
      const { iv, wrappedKey } = await wrapAlbumKey(key, mk);

      setAlbumKey(key);
      const body = new FormData();
      body.append("name", albumName);
      body.append("description", albumDescription);
      body.append("iv", arrayToBase64(iv));
      body.append("key", bufferToBase64(wrappedKey));
      fetcher.submit(body, { method: "POST" });
    } catch (e: unknown) {
      setIsLoading(false);
      setError(e instanceof Error ? e.message : "An error occurred.");
    }
  };

  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      fetcher.data.albumId &&
      fetcher.data.albumKeyId &&
      albumKey
    ) {
      storeKey(albumKey, fetcher.data.albumId, user.id).then(() => {
        setAlbumKey(null);
        navigate(`/dash/albums/${fetcher.data!.albumId}`);
      });
    }
  }, [fetcher, albumKey]);

  return (
    <div>
      <FormCard header="Create Album">
        <form onSubmit={onSubmit}>
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

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <Alert variant="error" revalidateable>
      {getErrorBoundaryMessage(error)}
    </Alert>
  );
}
