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

export const albums = sqliteTable("albums", {
  id: text("id").primaryKey().$default(generateId),
  createdOn: integer("created_on", { mode: "timestamp_ms" })
    .notNull()
    .$default(() => new Date()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default("")
});

export const albumKeys = sqliteTable("album_keys", {
  id: text("id").primaryKey().$default(generateId),
  createdOn: integer("created_on", { mode: "timestamp_ms" })
    .notNull()
    .$default(() => new Date()),
  albumId: text("album_id")
    .notNull()
    .references(() => albums.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  iv: text("iv").notNull()
});

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey().$default(generateId),
  iv: text("iv").notNull().default(""),
  createdOn: integer("created_on", { mode: "timestamp_ms" })
    .notNull()
    .$default(() => new Date()),
  albumId: text("album_id")
    .notNull()
    .references(() => albums.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id)
});

export const albumPermissions = sqliteTable("album_permissions", {
  id: text("id").primaryKey().$default(generateId),
  createdOn: integer("created_on", { mode: "timestamp_ms" })
    .notNull()
    .$default(() => new Date()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  grantedBy: text("granted_by")
    .notNull()
    .references(() => users.id),
  albumId: text("album_id")
    .notNull()
    .references(() => albums.id, { onDelete: "cascade" }),
  permission: text("permission", {
    enum: ["read", "write", "owner"]
  }).notNull()
});

// Relations
//
//
export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  authMethods: many(authMethods),
  albums: many(albums),
  albumKeys: many(albumKeys),
  albumPermissions: many(albumPermissions, { relationName: "user" }),
  albumPermissionsGranted: many(albumPermissions, { relationName: "grantedBy" })
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

export const albumRelations = relations(albums, ({ one, many }) => ({
  user: one(users, {
    fields: [albums.userId],
    references: [users.id]
  }),
  photos: many(photos),
  albumPermissions: many(albumPermissions)
}));

export const photoRelations = relations(photos, ({ one }) => ({
  album: one(albums, {
    fields: [photos.albumId],
    references: [albums.id]
  }),
  user: one(users, {
    fields: [photos.userId],
    references: [users.id]
  })
}));

export const albumPermissionRelations = relations(
  albumPermissions,
  ({ one }) => ({
    user: one(users, {
      fields: [albumPermissions.userId],
      references: [users.id],
      relationName: "user"
    }),
    grantedBy: one(users, {
      fields: [albumPermissions.grantedBy],
      references: [users.id],
      relationName: "grantedBy"
    }),
    album: one(albums, {
      fields: [albumPermissions.albumId],
      references: [albums.id]
    })
  })
);

export const albumKeyRelations = relations(albumKeys, ({ one }) => ({
  user: one(users, {
    fields: [albumKeys.userId],
    references: [users.id]
  }),
  album: one(albums, {
    fields: [albumKeys.albumId],
    references: [albums.id]
  })
}));
