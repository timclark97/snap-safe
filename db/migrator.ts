import "dotenv/config";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { migrate } from "drizzle-orm/libsql/migrator";

import { sqlite } from "@/lib/sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));

await migrate(sqlite, {
  migrationsFolder: resolve(__dirname, "migrations")
});
