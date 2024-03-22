import { Outlet, useRouteError } from "@remix-run/react";

import { FormCard, Alert } from "@/components/common";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";

export default function DashLayout() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <FormCard header="Create Your Account" subHeader="Set Your Password">
      <Alert variant="error" header="Something went wrong" revalidateable>
        <div>{getErrorBoundaryMessage(error)}</div>
      </Alert>
    </FormCard>
  );
}
