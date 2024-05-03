import { useLoaderData, useFetcher, useRouteError } from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
  json
} from "@remix-run/node";

import { emailSignInStart } from "@/lib/services/auth-service";
import { getSessionId } from "@/lib/services/session-service";
import { Alert, StyledLink, FormCard, Input, Button } from "@/components/common";
import GoogleButton from "@/components/GoogleButton";
import { getAuthOptions } from "@/lib/services/auth-service";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";
import { emailAuthValidator } from "@/lib/validators/auth-validators";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Sign In" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionId = await getSessionId(request);
  if (sessionId) {
    return redirect("/");
  }

  const error = new URL(request.url).searchParams.get("error_message")?.toString();

  return json({ options: getAuthOptions("sign-in"), error });
}

export async function action({ request }: ActionFunctionArgs) {
  const validator = emailAuthValidator(await request.formData());
  if (!validator.success) {
    throw json({ error: "Invalid email" }, { status: 400 });
  }
  await emailSignInStart(validator.data);
  return json({ success: true });
}

export default function Register() {
  const { options, error } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  return (
    <div>
      <FormCard header="Welcome Back">
        <div className="grid gap-6">
          {fetcher.data?.success ? (
            <Alert variant="success">Check your email for a sign in link</Alert>
          ) : (
            <>
              {options.email.on && (
                <fetcher.Form method="POST" className="grid gap-4">
                  <Input name="email" autoComplete="email" label="Email" type="email" />
                  <Button type="submit">Continue with Email</Button>
                </fetcher.Form>
              )}
              {options.google.on && <GoogleButton url={options.google.url} />}
            </>
          )}

          <Alert variant="warning" dismissible>
            {error}
          </Alert>

          <p className=" mt-4 text-center text-sm text-gray-500 md:mt-10">
            Need an account? <StyledLink to="/register">Register</StyledLink>
          </p>
        </div>
      </FormCard>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div>
      <FormCard header="Welcome Back">
        <Alert variant="error" header="Something went wrong" revalidateable>
          <div>{getErrorBoundaryMessage(error)}</div>
        </Alert>
      </FormCard>
    </div>
  );
}
