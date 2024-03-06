import { useEffect } from "react";
import { Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";

import { requireSession } from "@/lib/services";
import { DashHeader } from "@/components/common";
import { getKey } from "@/lib/services/keydb-service";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Dashboard" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  return json({ user: session.user });
}

export default function DashLayout() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  useEffect(() => {
    getKey(user.id, user.id).then((key) => {
      if (
        !key &&
        ![
          "/dash/confirm-password",
          "/dash/onboarding/password",
          "/dash/onboarding/password-set",
          "/dash/onboarding/name",
        ].includes(window.location.pathname)
      ) {
        navigate("/dash/confirm-password");
        return;
      }
      if (key && window.location.pathname === "/dash") {
        navigate("/dash/home");
      }
    });
  }, [user.id]);
  return (
    <div>
      <DashHeader user={user} />
      <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Outlet context={user} />
      </div>
    </div>
  );
}
