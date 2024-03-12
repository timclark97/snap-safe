import { useOutletContext } from "@remix-run/react";

import { LinkButton } from "@/components/common";
import { SessionUser } from "@/lib/services/session-service";

export default function DashHome() {
  const user = useOutletContext<SessionUser>();
  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-xl font-semibold">Welcome {user.firstName}</div>
      <LinkButton to="/dash/album/create">Create an album</LinkButton>
    </div>
  );
}
