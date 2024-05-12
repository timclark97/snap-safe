import type { Config } from "drizzle-kit";

if (
  !process.env.DB_URL ||
  (!process.env.DB_TOKEN && process.env.NODE_ENV !== "development")
) {
  throw new Error("DB_URL and DB_TOKEN must be set");
}

export default {
  schema: "./app/lib/sqlite/schema.ts",
  out: "./db/migrations",
  driver: "turso",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_URL,
    authToken: process.env.NODE_ENV === "development" ? "password" : process.env.DB_TOKEN
  }
} satisfies Config;
