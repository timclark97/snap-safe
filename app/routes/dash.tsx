import { useEffect } from "react";
import { Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useNavigate, useLocation } from "@remix-run/react";

import { requireSession } from "@/lib/services/session-service";
import { Alert, DashHeader } from "@/components/common";
import { getKey } from "@/lib/services/keydb-service";
import { serializeUser } from "@/lib/services/user-service";
import { SelfContextProvider } from "@/lib/contexts/self-context";
import { UploadContextProvider } from "@/lib/contexts/upload-context";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Dashboard" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  return json({ user: serializeUser(session.user) });
}

export default function DashLayout() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const gateKeep = async () => {
    if (
      [
        "/dash/confirm-password",
        "/dash/onboarding/password",
        "/dash/onboarding/password-set",
        "/dash/onboarding/name"
      ].includes(pathname)
    ) {
      return;
    }
    const key = await getKey(user.id, user.id);

    if (!key && pathname !== "/dash/confirm-password") {
      navigate("/dash/confirm-password");
      return;
    }

    if (pathname === "/dash") {
      navigate("/dash/home");
      return;
    }
  };

  useEffect(() => {
    gateKeep();
  }, [user.id]);

  return (
    <>
      <DashHeader user={user} />
      <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SelfContextProvider user={user}>
          <UploadContextProvider>
            <Outlet />
          </UploadContextProvider>
        </SelfContextProvider>
      </div>
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <Alert variant="error" revalidateable>
      {getErrorBoundaryMessage(error)}
    </Alert>
  );
}
