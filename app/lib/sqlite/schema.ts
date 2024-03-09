import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

import { generateId } from "../helpers/id-generator";

// Tables
//
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$default(generateId),
  createdOn: integer("created_on", { mode: "timestamp_ms" })
    .notNull()
    .$default(() => new Date()),
  updatedOn: integer("updated_on", { mode: "timestamp_ms" })
    .notNull()
    .$default(() => new Date()),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  mkS: text("mk_s"),
  mkT: text("mk_t"),
  mkTIv: text("mk_t_iv"),
  puK: text("pu_k"),
  prK: text("pr_k"),
  prKIv: text("pr_k_iv")
});
export type DBUser = typeof users.$inferSelect;

export const authMethods = sqliteTable("auth_methods", {
  id: text("id").primaryKey().$default(generateId),
  createdOn: integer("created_on", { mode: "timestamp_ms" })
    .notNull()
    .$default(() => new Date()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["email", "google"] }).notNull(),
  value: text("value").notNull()
});

export const authCodes = sqliteTable("authentication_codes", {
  id: text("id").primaryKey().$default(generateId),
  createdOn: integer("created_on", { mode: "timestamp_ms" })
    .notNull()
    .$default(() => new Date()),
  expiresOn: integer("expires_on", { mode: "timestamp_ms" })
    .notNull()
    .$default(() => {
      const d = new Date();
      d.setMinutes(d.getMinutes() + 15);
      return d;
    }),
  metaData: text("meta_data", { mode: "json" })
    .$type<{ email: string; type: "register" | "sign-in" }>()
    .notNull()
});

// export const invitations = sqliteTable("invitations", {
//   id: text("id").primaryKey().$default(generateId),
//   createdOn: integer("created_on", { mode: "timestamp_ms" })
//     .notNull()
//     .$default(() => new Date()),
//   expiresOn: integer("expires_on", { mode: "timestamp_ms" })
//     .notNull()
//     .$default(() => {
//       const d = new Date();
//       d.setDate(d.getDate() + 14);
//       return d;
//     }),
//   email: text("email").notNull(),
//   code: text("code").notNull(),
// });

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$default(generateId),
  createdOn: integer("created_on", { mode: "timestamp_ms" })
    .notNull()
    .$default(() => new Date()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresOn: integer("expires_on", { mode: "timestamp_ms" })
    .notNull()
    .$default(() => {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      return d;
    })
});

// Relations
//
//
export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  authMethods: many(authMethods)
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));

export const authMethodRelations = relations(authMethods, ({ one }) => ({
  user: one(users, {
    fields: [authMethods.userId],
    references: [users.id]
  })
}));
