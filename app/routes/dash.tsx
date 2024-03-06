import { Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

import { requireSession } from "@/lib/services";
import { DashHeader } from "@/components/common";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Dashboard" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  return json({ user: session.user });
}

export default function DashLayout() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <div>
      <DashHeader user={user} />
      <Outlet context={user} />
    </div>
  );
}
