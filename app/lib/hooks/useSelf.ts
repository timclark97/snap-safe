import { useOutletContext } from "@remix-run/react";

import { SessionUser } from "../services/session-service";

export const useSelf = () => {
  const outlet = useOutletContext<SessionUser>();
  return outlet;
};
