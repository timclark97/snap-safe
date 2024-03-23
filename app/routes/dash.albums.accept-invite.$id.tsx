import { useEffect, useState } from "react";
import { LoaderFunctionArgs, ActionFunctionArgs, json } from "@remix-run/node";
import {
  useLoaderData,
  useFetcher,
  useRouteError,
  useNavigate
} from "@remix-run/react";
import { eq, and } from "drizzle-orm";

import {
  sqlite,
  albumInvites,
  albumPermissions,
  albumKeys
} from "@/lib/sqlite";
import { requireSession } from "@/lib/services/session-service";
import { FormCard, Button, Input, Alert } from "@/components/common";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";
import {
  deriveMK,
  testMK,
  unwrapPriKey,
  wrapAlbumKey,
  unwrapSharedKey
} from "@/lib/services/crypto-service";
import { useSelf } from "@/lib/contexts/self-context";
import { storeKey } from "@/lib/services/keydb-service";
import { arrayToBase64, bufferToBase64 } from "@/lib/helpers/binary-helpers";
import { acceptAlbumInviteValidator } from "@/lib/validators/album-validators";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await requireSession(request);

  if (
    !session.user.prK ||
    !session.user.prKIv ||
    !session.user.mkS ||
    !session.user.mkT ||
    !session.user.mkTIv
  ) {
    throw json(
      { error: "You need to set your password before accepting the invite" },
      { status: 400 }
    );
  }
  const id = params.id as string;

  const invite = await sqlite
    .select()
    .from(albumInvites)
    .where(
      and(eq(albumInvites.id, id), eq(albumInvites.userId, session.userId))
    );

  if (!invite.length) {
    throw json({ error: "Invite not found" }, { status: 404 });
  }

  return json({
    inviteKey: invite[0].wk,
    albumId: invite[0].albumId,
    grantedPermission: invite[0].permission,
    prK: session.user.prK,
    prKIv: session.user.prKIv,
    mkS: session.user.mkS,
    mkT: session.user.mkT,
    mkTIv: session.user.mkTIv
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const session = await requireSession(request);
  const id = params.id as string;
  const validator = acceptAlbumInviteValidator(await request.formData());

  if (!validator.success) {
    throw json({ error: "Bad request. Please try again." }, { status: 400 });
  }

  const invite = await sqlite
    .select()
    .from(albumInvites)
    .where(
      and(eq(albumInvites.id, id), eq(albumInvites.userId, session.userId))
    );

  if (!invite.length) {
    throw json({ error: "Invite not found" }, { status: 404 });
  }

  await sqlite.transaction(async (db) => {
    await db.delete(albumInvites).where(eq(albumInvites.id, id));
    await db.insert(albumPermissions).values({
      userId: session.userId,
      grantedBy: invite[0].grantedBy,
      albumId: invite[0].albumId,
      permission: invite[0].permission
    });
    await db.insert(albumKeys).values({
      userId: session.userId,
      albumId: invite[0].albumId,
      key: validator.data.key,
      iv: validator.data.iv
    });
  });

  return json({ success: true, albumId: invite[0].albumId });
}

export default function AcceptInvite() {
  const data = useLoaderData<typeof loader>();
  const self = useSelf();
  const [error, setError] = useState<string | null>(null);
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();

  useEffect(() => {
    if (fetcher?.data?.success && fetcher.data.albumId) {
      navigate(`/dash/albums/${fetcher.data.albumId}`);
    }
  }, [fetcher]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = new FormData(e.currentTarget).get("password") as string;
    const mk = await deriveMK(self.id, password, data.mkS);
    if (!(await testMK(mk, data.mkT, data.mkTIv))) {
      setError("Password is incorrect");
      return;
    }
    const pk = await unwrapPriKey(data.prK, data.prKIv, mk);
    const usages: KeyUsage[] =
      data.grantedPermission === "read" ? ["decrypt"] : ["encrypt", "decrypt"];
    const albumKey = await unwrapSharedKey(pk, data.inviteKey, usages);
    // await storeKey(albumKey, data.albumId, self.id);

    const { wrappedKey, iv } = await wrapAlbumKey(albumKey, mk);

    const fd = new FormData();
    fd.append("key", bufferToBase64(wrappedKey));
    fd.append("iv", arrayToBase64(iv));
    fetcher.submit(fd, { method: "POST" });
  };

  return (
    <FormCard
      header="Accept Invitation"
      subHeader="Enter your password to accept the invitation"
    >
      <form onSubmit={onSubmit}>
        <fieldset className="grid gap-4">
          <Alert variant="error" dismissible>
            {error}
          </Alert>
          <Input name="password" type="password" label="Password" />
          <Button type="submit">Accept</Button>
        </fieldset>
      </form>
    </FormCard>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return <Alert variant="error">{getErrorBoundaryMessage(error)}</Alert>;
}
