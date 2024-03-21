import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, redirect, useNavigation } from "@remix-run/react";

import { requireSession } from "@/lib/services/session-service";
import { updateUser } from "@/lib/services/user-service";
import { Button, Input, FormCard } from "@/components/common";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Welcome" }];
};

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireSession(request);
  const body = await request.formData();
  const firstName = body.get("firstName")?.toString();
  const lastName = body.get("lastName")?.toString();
  await updateUser(session.userId, { firstName, lastName });

  return redirect("/dash/onboarding/password");
}

export default function DashLayout() {
  const { state } = useNavigation();
  return (
    <div>
      <Form method="POST">
        <FormCard header="Create Your Account" subHeader="Enter your name">
          <fieldset disabled={state === "submitting"} className="grid gap-8">
            <Input required name="firstName" label="First Name" />
            <Input required name="lastName" label="Last Name" />
            <Button isLoading={state === "submitting"} type="submit">
              Next
            </Button>
          </fieldset>
        </FormCard>
      </Form>
    </div>
  );
}
