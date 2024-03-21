import { type ActionFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/services/session-service";
import { sqlite, photos } from "@/lib/sqlite";
import { deleteObject } from "@/lib/services/bucket-service";
import { hasWriteAccess } from "@/lib/services/album-service";

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

  const album = await sqlite.query.albums.findFirst({
    where: (a, { eq }) => eq(a.id, params.id as string)
  });

  if (!album) {
    return new Response(JSON.stringify({ error: "Album not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  if (!(await hasWriteAccess(session.userId, params.id as string))) {
    return new Response(JSON.stringify({ error: "Unable to access album" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  deleteObject(params.photoId as string);

  await sqlite
    .delete(photos)
    .where(eq(photos.id, params.photoId as string))
    .execute();

  return new Response(null, {
    status: 204
  });
}
