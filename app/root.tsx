import { useEffect } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLocation, useNavigate, useLoaderData } from "@remix-run/react";
import "@fontsource-variable/inter";

import "@/base.css";
import favicon from "@/icons/favicon.svg";

import { requireSession } from "./lib/services/session-service";
import { getMasterKey } from "./lib/services/keydb-service";
import { serializeUser } from "./lib/services/user-service";
import { DashHeader } from "./components/common";
import { SelfContextProvider } from "./lib/contexts/self-context";
import { UploadContextProvider } from "./lib/contexts/upload-context";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe" }];
};

const unprotectedRoutes = [
  "/sign-in",
  "/register",
  "/google-callback",
  "/email-callback"
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  if (unprotectedRoutes.includes(url.pathname)) {
    return { user: null };
  }
  const session = await requireSession(request);
  return { user: serializeUser(session.user) };
}

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useLoaderData<typeof loader>();

  const gateKeep = async () => {
    if (!user) {
      return;
    }
    if (
      [
        "/confirm-password",
        "/onboarding/password",
        "/onboarding/password-set",
        "/onboarding/name",
        "/sign-in",
        "/register",
        "/google-callback",
        "/email-callback"
      ].includes(pathname)
    ) {
      return;
    }

    const key = await getMasterKey(user.id);

    if (!key && pathname !== "/confirm-password") {
      navigate("/confirm-password");
      return;
    }
  };

  useEffect(() => {
    gateKeep();
  }, [user]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg" href={favicon} />
        <Meta />
        <Links />
      </head>
      <body>
        <DashHeader user={user} />
        <SelfContextProvider user={user!}>
          <UploadContextProvider>
            <Outlet />
          </UploadContextProvider>
        </SelfContextProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
