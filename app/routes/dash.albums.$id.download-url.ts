import { type ActionFunctionArgs } from "@remix-run/node";

import { requireSession } from "@/lib/services/session-service";
import { createGetRequest } from "@/lib/services/bucket-service";
import { hasAlbumPermission } from "@/lib/services/album-service";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  const albumId = params.id as string;
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

  if (!(await hasAlbumPermission(session.userId, albumId, "read"))) {
    return new Response(JSON.stringify({ error: "Unable to access album" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  const { url } = await createGetRequest(body.photoId);

  return new Response(JSON.stringify({ url }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
