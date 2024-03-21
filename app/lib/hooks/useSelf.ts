import { useOutletContext } from "@remix-run/react";

import { SessionUser } from "../services/session-service";

export const useSelf = () => {
  const outlet = useOutletContext<{ user: SessionUser }>();
  return outlet.user;
};
