import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useRouteError, useLoaderData } from "@remix-run/react";

import { getAlbumDetails, shareAlbum } from "@/lib/services/album-service";
import {
  shareAlbumActionValidator,
  shareAlbumLoadValidator
} from "@/lib/validators/album-validators";
import { requireSession } from "@/lib/services/session-service";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";
import { getUserByEmail } from "@/lib/services/user-service";
import { Alert, RouteModal } from "@/components/common";
import ShareAlbumForm from "@/components/share-album/ShareAlbumForm";

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
  const { album, key } = useLoaderData<typeof loader>();

  return (
    <RouteModal>
      <div className="md:max-w-sm">
        <div className="text-center text-2xl font-medium">Share Your Album</div>
        <div className="text-center leading-5 text-gray-600 mt-2 pb-3">
          Enter the email of who you want to share with. If they don't have an account,
          you will need to send them an invitation.
        </div>
        <ShareAlbumForm album={album} rawKey={key} />
      </div>
    </RouteModal>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <RouteModal>
      <div className="md:max-w-sm">
        <div className="text-center text-2xl font-medium">Share Your Album</div>
        <div className="text-center leading-5 text-gray-600 mt-2 pb-3">
          Enter the email of who you want to share with. If they don't have an account,
          you will need to send them an invitation.
        </div>
        <Alert variant="warning" revalidateable>
          {getErrorBoundaryMessage(error)}
        </Alert>
      </div>
    </RouteModal>
  );
}
