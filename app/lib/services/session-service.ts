import { createCookie, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";

import { sessions, sqlite } from "@/lib/sqlite";
import { serializeUser } from "./user-service";

const sessionCookie = createCookie("s_id", {
  httpOnly: true,
  sameSite: "strict",
  secure: true,
  path: "/"
});

/**
 * This returns the session id
 */
export const getSessionId = async (req: Request) => {
  const id = (await sessionCookie.parse(
    req.headers.get("Cookie") ?? ""
  )) as string;
  if (!id) {
    return undefined;
  }
  return id.toString();
};

/**
 * This returns the string to use with `Set-Cookie` header
 */
export const createSessionCookie = async (
  sessionId: string,
  expires: number | Date
): Promise<string> => {
  return await sessionCookie.serialize(sessionId, {
    expires: typeof expires === "number" ? new Date(expires) : expires
  });
};

export type SessionUser = {
  id: string;
  createdOn: number;
  firstName: string;
  lastName: string;
};
export type Session = {
  id: string;
  userId: string;
  expiresOn: Date;
  user: SessionUser;
};

export const requireSession = async (request: Request): Promise<Session> => {
  const sessionId = await getSessionId(request);
  if (!sessionId) {
    console.log("no session id");
    throw redirect("/sign-in", {
      headers: {
        "Set-Cookie": await createSessionCookie("", new Date(0))
      }
    });
  }
  const session = await sqlite.query.sessions.findFirst({
    where: (s, { eq }) => eq(s.id, sessionId),
    columns: {
      id: true,
      userId: true,
      expiresOn: true
    },
    with: {
      user: {
        columns: {
          id: true,
          createdOn: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!session) {
    console.log("no session");
    throw redirect("/sign-in", {
      headers: {
        "Set-Cookie": await createSessionCookie("", new Date(0))
      }
    });
  }

  if (session.expiresOn.getTime() < Date.now()) {
    console.log("session expired");
    await deleteSession(session.id);
    throw redirect("/sign-in?error_message=Session%20expired", {
      headers: {
        "Set-Cookie": await createSessionCookie("", new Date(0))
      }
    });
  }

  return {
    ...session,
    user: serializeUser(session.user)
  };
};

export const deleteSession = async (sessionId: string) => {
  await sqlite.delete(sessions).where(eq(sessions.id, sessionId));
};
