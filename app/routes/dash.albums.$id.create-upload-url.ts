import { type ActionFunctionArgs } from "@remix-run/node";

import { requireSession } from "@/lib/services/session-service";
import { sqlite } from "@/lib/sqlite";
import { createUploadRequest } from "@/lib/services/bucket-service";
import { hasWriteAccess } from "@/lib/services/album-service";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  const session = await requireSession(request);
  const body = await request.json();

  if (!body.photoId) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

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

  const { url } = await createUploadRequest(body.photoId);

  return new Response(JSON.stringify({ url }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
