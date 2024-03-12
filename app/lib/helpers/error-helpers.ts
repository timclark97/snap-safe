import { isRouteErrorResponse } from "@remix-run/react";

export const getErrorBoundaryMessage = (e: unknown) => {
  if (e instanceof Error) {
    return e.message;
  }
  if (isRouteErrorResponse(e)) {
    return e.data;
  }
  return "Something went wrong";
};
