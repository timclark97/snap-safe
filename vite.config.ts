import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default defineConfig({
  plugins: [
    tsconfigPaths({ root: "." }),
    remix({ ignoredRouteFiles: ["**/.*"] })
  ]
});
