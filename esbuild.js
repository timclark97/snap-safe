import { build } from "esbuild";

await build({
  entryPoints: [
    "app/lib/workers/upload-worker.ts",
    "app/lib/workers/download-worker.ts"
  ],
  bundle: true,
  outdir: "public/workers"
});
