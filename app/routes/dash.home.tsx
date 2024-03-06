import { useOutletContext } from "@remix-run/react";

import { LinkButton } from "@/components/common";
import { SessionUser } from "@/lib/services";

export default function DashHome() {
  const user = useOutletContext<SessionUser>();
  return (
    <div className="">
      <div className="text-xl font-semibold">Welcome {user.firstName}</div>
      <LinkButton to="/dash/album/create">Create an album</LinkButton>
    </div>
  );
}
