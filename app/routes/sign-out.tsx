import { useEffect } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { getSessionId, deleteSession } from "@/lib/services/session-service";
import { clearStore } from "@/lib/services/keydb-service";

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionId = await getSessionId(request);
  if (!sessionId) {
    return redirect("/", {
      headers: {
        "Set-Cookie": `s_id=; Path=/; HttpOnly; Max-Age=0`
      }
    });
  }

  await deleteSession(sessionId);

  return new Response(null, {
    headers: {
      "Set-Cookie": `s_id=; Path=/; HttpOnly; Max-Age=0`
    }
  });
}

export default function Logout() {
  useEffect(() => {
    clearStore();
    window.location.href = "/";
  }, []);
  return (
    <div>
      <h1>Logging Out</h1>
    </div>
  );
}
