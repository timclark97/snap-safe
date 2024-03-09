import { useLoaderData, Form } from "@remix-run/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";

import { getSessionId } from "@/lib/services/session-service";
import SimpleHeader from "@/components/common/SimpleHeader";
import {
  Alert,
  StyledLink,
  FormCard,
  Input,
  Button
} from "@/components/common";
import GoogleButton from "@/components/GoogleButton";
import { getAuthOptions } from "@/lib/services/auth-service";

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

  return json({ options: getAuthOptions("sign-in"), error });
}

export default function Register() {
  const { options, error } = useLoaderData<typeof loader>();

  return (
    <div>
      <SimpleHeader />
      <FormCard header="Welcome Back">
        <div className="grid gap-6">
          <Alert variant="warning" dismissible>
            {error}
          </Alert>
          {options.email.on && (
            <Form method="POST" className="grid gap-4">
              <Input name="email" autoComplete="email" label="Email" />
              <Button>Continue with Email</Button>
            </Form>
          )}
          {options.google.on && <GoogleButton url={options.google.url} />}

          <p className=" mt-4 text-center text-sm text-gray-500 md:mt-10">
            Need an account? <StyledLink to="/register">Register</StyledLink>
          </p>
        </div>
      </FormCard>
    </div>
  );
}
