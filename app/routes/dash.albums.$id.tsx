import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRouteError } from "@remix-run/react";
import { eq, and } from "drizzle-orm";

import { requireSession } from "@/lib/services/session-service";
import { sqlite, albums, albumPermissions, photos } from "@/lib/sqlite";
import { Alert, Button } from "@/components/common";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  const queryResult = await sqlite
    .select()
    .from(albums)
    .where(eq(albums.id, params.id as string))
    .leftJoin(
      albumPermissions,
      and(
        eq(albumPermissions.albumId, albums.id),
        eq(albumPermissions.userId, session.userId)
      )
    )
    .execute();

  if (queryResult.length === 0) {
    throw json({ message: "Album not found" }, { status: 404 });
  }

  const [result] = queryResult;

  if (!result.album_permissions) {
    throw json(
      { message: "You don't have permission to view this album" },
      { status: 403 }
    );
  }

  const albumPhotos = await sqlite
    .select()
    .from(photos)
    .where(eq(photos.albumId, result.albums.id))
    .limit(50)
    .execute();

  return json({
    album: result.albums,
    permission: result.album_permissions,
    photos: albumPhotos
  });
}

export default function Album() {
  const { album, permission, photos } = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="text-2xl font-medium justify-between items-center flex">
        <h1>{album.name}</h1>
        <Button>Upload</Button>
      </div>
      <p>{album.description}</p>
      {/* <div>
        {photos.map((photo) => (
          <img key={photo.id} src={`/photos/${photo.id}`} alt="" />
        ))}
      </div> */}
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
