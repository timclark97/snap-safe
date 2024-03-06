import { useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { redirect, json } from "@remix-run/node";

import { getSessionId } from "@/lib/services/session-service";
import SimpleHeader from "@/components/common/SimpleHeader";
import { Alert, StyledLink } from "@/components/common";
import GoogleButton from "@/components/GoogleButton";
import { generateAuthUrl } from "@/lib/oauth-providers/google";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Sign In" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionId = await getSessionId(request);
  if (sessionId) {
    return redirect("/dash");
  }

  const error = new URL(request.url).searchParams
    .get("error_message")
    ?.toString();

  return json({ googleAuthUrl: generateAuthUrl("sign-in"), error });
}

export default function Register() {
  const { googleAuthUrl, error } = useLoaderData<typeof loader>();

  return (
    <div>
      <SimpleHeader />
      <div className="m-auto max-w-md px-4 pt-10 md:px-8">
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-8 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <LockClosedIcon className="m-auto w-20 fill-indigo-600" />
            <h2 className="mt-8 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Sign in to your account
            </h2>
          </div>
          <Alert variant="warning" dismissible>
            {error}
          </Alert>
          <div className=" mt-4 sm:mx-auto sm:w-full sm:max-w-sm md:mt-10">
            <GoogleButton url={googleAuthUrl} />
            <p className=" mt-4 text-center text-sm text-gray-500 md:mt-10">
              Need an account? <StyledLink to="/register">Register</StyledLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
