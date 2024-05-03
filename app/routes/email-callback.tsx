import { useEffect } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRouteError } from "@remix-run/react";

import { emailRegisterFinish, emailSignInFinish } from "@/lib/services/auth-service";
import { sqlite, sessions } from "@/lib/sqlite";
import { createSessionCookie } from "@/lib/services/session-service";
import { Alert, StyledLink } from "@/components/common";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";

export async function loader({ request }: LoaderFunctionArgs) {
  const sp = new URL(request.url).searchParams;
  const id = sp.get("code");
  const type = sp.get("type");

  if (!id) {
    throw new Error("Something went wrong. Please try again");
  }

  let user;
  if (type === "register") {
    user = await emailRegisterFinish(id);
  }

  if (type === "sign-in") {
    user = await emailSignInFinish(id);
  }

  if (!user) {
    throw new Error("Something went wrong. Please try again");
  }

  const [session] = await sqlite
    .insert(sessions)
    .values({
      userId: user.id
    })
    .returning();

  const cookie = await createSessionCookie(session.id, session.expiresOn);
  const sendTo = type === "register" ? "/onboarding/name" : "/";

  return json(
    {
      sendTo
    },
    {
      headers: {
        "Set-Cookie": cookie
      }
    }
  );
}

export default function EmailCallback() {
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
  return (
    <div>
      <div className=" mt-4 flex min-h-full flex-1 flex-col justify-center px-6 py-8 md:mt-10 lg:px-8">
        <div className=" mt-4 sm:mx-auto sm:w-full sm:max-w-sm md:mt-10">
          <Alert variant="error" header="Something went wrong">
            <div>{getErrorBoundaryMessage(error)}</div>
            <StyledLink to="/sign-in" className="text-inherit underline">
              Try Again
            </StyledLink>
          </Alert>
        </div>
      </div>
    </div>
  );
}
