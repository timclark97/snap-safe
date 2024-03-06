import { useEffect } from "react";
import { LoaderFunctionArgs, redirect, json } from "@remix-run/node";
import {
  useRouteError,
  isRouteErrorResponse,
  useLoaderData,
  useNavigate
} from "@remix-run/react";

import { getDataFromCallback } from "@/lib/oauth-providers/google";
import { sqlite, authMethods, users, sessions } from "@/lib/sqlite";
import {
  createSessionCookie,
  getSessionId
} from "@/lib/services/session-service";
import { Alert, StyledLink } from "@/components/common";
import SimpleHeader from "@/components/common/SimpleHeader";

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionId = await getSessionId(request);
  if (sessionId) {
    return redirect("/dash");
  }

  const { state, idToken } = await getDataFromCallback(request.url);
  const authMethod = await sqlite.query.authMethods.findFirst({
    where: (am, { eq, and }) =>
      and(eq(am.type, "google"), eq(am.value, idToken.sub))
  });
  if (state === "register") {
    if (authMethod) {
      return redirect(
        "/sign-in?error_message=" +
          encodeURIComponent(
            "This Google account is already associated with a user."
          )
      );
    }

    const userId = await sqlite.transaction(async (tx) => {
      const [{ id }] = await tx.insert(users).values({}).returning().execute();

      await tx
        .insert(authMethods)
        .values({
          type: "google",
          value: idToken.sub,
          userId: id
        })
        .execute();

      return id;
    });

    const [{ id, expiresOn }] = await sqlite
      .insert(sessions)
      .values({ userId })
      .returning()
      .execute();

    return json(
      {
        sendTo: "/dash/onboarding/name"
      },
      {
        headers: {
          "Set-Cookie": await createSessionCookie(id, expiresOn)
        }
      }
    );
  }

  if (state === "sign-in") {
    if (!authMethod) {
      return redirect(
        "/register?error_message=" +
          encodeURIComponent(
            "This Google account is not associated with a user."
          )
      );
    }
    const user = await sqlite.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, authMethod.userId)
    });
    if (!user) {
      return redirect(
        "/register?error_message=" +
          encodeURIComponent(
            "This Google account is not associated with a user."
          )
      );
    }
    const [{ id, expiresOn }] = await sqlite
      .insert(sessions)
      .values({
        userId: user.id
      })
      .returning()
      .execute();

    return json(
      {
        sendTo: "/dash"
      },
      {
        headers: {
          "Set-Cookie": await createSessionCookie(id, expiresOn)
        }
      }
    );
  }

  throw new Error("Something went wrong. Please try again.");
}

export default function GoogleCallback() {
  const { sendTo } = useLoaderData<typeof loader>();
  const nav = useNavigate();
  useEffect(() => nav(sendTo), [nav, sendTo]);

  return (
    <div>
      <h1>Loading...</h1>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div>
      <SimpleHeader />
      <div className=" mt-4 flex min-h-full flex-1 flex-col justify-center px-6 py-8 md:mt-10 lg:px-8">
        <div className=" mt-4 sm:mx-auto sm:w-full sm:max-w-sm md:mt-10">
          <Alert variant="error" header="Something went wrong">
            <div>
              {" "}
              {isRouteErrorResponse(error) ? error.data : "An error occurred"}
            </div>
            <StyledLink to="/sign-in" className="text-inherit">
              Try Again
            </StyledLink>
          </Alert>
        </div>
      </div>
    </div>
  );
}
