import { isRouteErrorResponse } from "@remix-run/react";

export const getErrorBoundaryMessage = (e: unknown) => {
  if (e instanceof Error) {
    return e.message;
  }
  if (isRouteErrorResponse(e)) {
    return e.data.message || e.data.error || "Something went wrong";
  }
  return "Something went wrong";
};
