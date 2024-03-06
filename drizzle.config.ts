import type { Config } from "drizzle-kit";

if (!process.env.DB_URL || !process.env.DB_TOKEN) {
  throw new Error("DB_URL and DB_TOKEN environment variables must be set");
}

export default {
  schema: "./app/lib/sqlite/schema.ts",
  out: "./db/migrations",
  driver: "turso",
  dbCredentials: {
    url: process.env.DB_URL,
    authToken: process.env.DB_TOKEN
  }
} satisfies Config;
