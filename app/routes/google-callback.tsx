import { useEffect } from "react";
import { LoaderFunctionArgs, redirect, json } from "@remix-run/node";
import {
  useRouteError,
  isRouteErrorResponse,
  useLoaderData
} from "@remix-run/react";

import { getDataFromCallback } from "@/lib/oauth-providers/google";
import { sqlite, sessions } from "@/lib/sqlite";
import { googleRegister, googleSignIn } from "@/lib/services/auth-service";
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
  if (state === "register") {
    const user = await googleRegister(idToken.sub, idToken.email);

    const [{ id, expiresOn }] = await sqlite
      .insert(sessions)
      .values({ userId: user.id })
      .returning()
      .execute();

    return json(
      { sendTo: "/dash/onboarding/name" },
      {
        headers: {
          "Set-Cookie": await createSessionCookie(id, expiresOn)
        }
      }
    );
  }

  if (state === "sign-in") {
    const user = await googleSignIn(idToken.sub);
    const [{ id, expiresOn }] = await sqlite
      .insert(sessions)
      .values({
        userId: user.id
      })
      .returning()
      .execute();

    return json(
      { sendTo: "/dash" },
      { headers: { "Set-Cookie": await createSessionCookie(id, expiresOn) } }
    );
  }

  throw new Error("Something went wrong. Please try again.");
}

export default function GoogleCallback() {
  const { sendTo } = useLoaderData<typeof loader>();
  useEffect(() => {
    if (sendTo) {
      // Using Remix's `useNavigation` to do this routing causes cookie issues
      window.location.href = sendTo;
    }
  }, [sendTo]);

  return (
    <div>
      <h1>Loading...</h1>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const errorMessage =
    error instanceof Error
      ? error.message
      : isRouteErrorResponse(error)
        ? error.data
        : "An error occurred";
  return (
    <div>
      <SimpleHeader />
      <div className=" mt-4 flex min-h-full flex-1 flex-col justify-center px-6 py-8 md:mt-10 lg:px-8">
        <div className=" mt-4 sm:mx-auto sm:w-full sm:max-w-sm md:mt-10">
          <Alert variant="error" header="Something went wrong">
            <div>{errorMessage}</div>
            <StyledLink to="/sign-in" className="text-inherit underline">
              Try Again
            </StyledLink>
          </Alert>
        </div>
      </div>
    </div>
  );
}
