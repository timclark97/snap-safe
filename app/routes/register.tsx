import { Form, useLoaderData } from "@remix-run/react";
import type {
  LoaderFunctionArgs,
  MetaFunction,
  ActionFunctionArgs,
} from "@remix-run/node";
import { redirect, json } from "@remix-run/node";

import { getSessionId } from "@/lib/services/session-service";
import SimpleHeader from "@/components/common/SimpleHeader";
import {
  Alert,
  StyledLink,
  Button,
  Input,
  FormCard,
} from "@/components/common";
import GoogleButton from "@/components/GoogleButton";
import { getAuthOptions } from "@/lib/services/auth-service";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Register" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionId = await getSessionId(request);
  if (sessionId) {
    return redirect("/dash");
  }

  const error = new URL(request.url).searchParams
    .get("error_message")
    ?.toString();

  return json({ options: getAuthOptions("register"), error });
}

// export async function action({ request }: ActionFunctionArgs) {}

export default function Register() {
  const { options, error } = useLoaderData<typeof loader>();

  return (
    <div>
      <SimpleHeader />
      <FormCard header="Create Your Account">
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
          <p className="text-center text-sm text-gray-500 md:mt-10">
            Already have an account?{" "}
            <StyledLink to="/sign-in">Sign in</StyledLink>
          </p>
        </div>
      </FormCard>
    </div>
  );
}
