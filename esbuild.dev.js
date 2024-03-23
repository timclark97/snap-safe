import { context } from "esbuild";

const esbuild = await context({
  entryPoints: [
    "app/lib/workers/upload-worker.ts",
    "app/lib/workers/download-worker.ts"
  ],
  bundle: true,
  outdir: "public/workers",
  format: "esm"
});

await esbuild.watch();
