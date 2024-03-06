import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";
import "@fontsource-variable/inter";

import "@/base.css";
import favicon from "@/icons/favicon.svg";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe" }];
};

export default function App() {
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
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
