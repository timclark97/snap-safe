import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  Form,
  json,
  redirect,
  useNavigation,
  useActionData,
} from "@remix-run/react";

import { requireSession, updateUser } from "@/lib/services";
import { Button, Input, FormCard } from "@/components/common";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Welcome" }];
};

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireSession(request);
  const body = await request.formData();
  const firstName = body.get("firstName")?.toString();
  const lastName = body.get("lastName")?.toString();
  const result = await updateUser(session.userId, { firstName, lastName });
  if ("errors" in result) {
    return json(result, { status: 400 });
  }

  return redirect("/dash/onboarding/password");
}

export default function DashLayout() {
  const { state } = useNavigation();
  const result = useActionData<typeof action>();
  return (
    <div>
      <Form method="POST">
        <FormCard header="Create Your Account" subHeader="Enter your name">
          <fieldset disabled={state === "submitting"} className="grid gap-8">
            <Input
              required
              name="firstName"
              label="First Name"
              errors={result?.errors}
            />
            <Input
              required
              name="lastName"
              label="Last Name"
              errors={result?.errors}
            />
            <Button isLoading={state === "submitting"} type="submit">
              Next
            </Button>
          </fieldset>
        </FormCard>
      </Form>
    </div>
  );
}
