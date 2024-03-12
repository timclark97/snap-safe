import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { getSessionId, deleteSession } from "@/lib/services/session-service";

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionId = await getSessionId(request);
  if (!sessionId) {
    return redirect("/");
  }

  await deleteSession(sessionId);

  return redirect("/", {
    headers: {
      "Set-Cookie": `s_id=; Path=/; HttpOnly; Max-Age=0`
    }
  });
}

export default function Logout() {
  return (
    <div>
      <h1>Logging Out</h1>
    </div>
  );
}
