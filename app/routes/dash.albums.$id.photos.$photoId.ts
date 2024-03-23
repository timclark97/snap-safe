import { type ActionFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/services/session-service";
import { sqlite, photos } from "@/lib/sqlite";
import { deleteObject } from "@/lib/services/bucket-service";
import { hasAlbumPermission } from "@/lib/services/album-service";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "DELETE") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  const session = await requireSession(request);
  const albumId = params.id as string;
  const photoId = params.photoId as string;

  if (!(await hasAlbumPermission(session.userId, albumId, "write"))) {
    return new Response(JSON.stringify({ error: "Unable to access album" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  deleteObject(photoId);

  await sqlite.delete(photos).where(eq(photos.id, photoId));

  return new Response(null, {
    status: 204
  });
}
