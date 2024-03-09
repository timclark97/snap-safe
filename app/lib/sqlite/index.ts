import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

import * as schema from "./schema";

if (!process.env.DB_URL || !process.env.DB_TOKEN) {
  throw new Error("DB_URL and DB_TOKEN must be set");
}

const client = createClient({
  url: process.env.DB_URL,
  authToken: process.env.DB_TOKEN,
});
export const sqlite = drizzle(client, { schema });
export { users, authMethods, sessions, authCodes } from "./schema";
export type { DBUser } from "./schema";
