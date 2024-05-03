import { json } from "@remix-run/node";
import { eq, and } from "drizzle-orm";

import {
  sqlite,
  albumKeys,
  albums,
  albumPermissions,
  albumInvites,
  users
} from "@/lib/sqlite";
import { getUserByEmail } from "./user-service";
import { sendEmail } from "./email-service";

export const insertAlbum = async ({
  userId,
  name,
  description,
  key,
  iv
}: {
  userId: string;
  name: string;
  description?: string;
  key: string;
  iv: string;
}) => {
  const { albumId, albumKeyId } = await sqlite.transaction(async (db) => {
    const [album] = await db
      .insert(albums)
      .values({
        userId: userId,
        name,
        description
      })
      .returning();
    const [albumKey] = await db
      .insert(albumKeys)
      .values({
        userId: userId,
        albumId: album.id,
        key,
        iv
      })
      .returning();
    await db.insert(albumPermissions).values({
      userId: userId,
      albumId: album.id,
      permission: "owner",
      grantedBy: userId
    });

    return { albumId: album.id, albumKeyId: albumKey.id };
  });
  return { albumId, albumKeyId };
};

export const hasAlbumPermission = async (
  userId: string,
  albumId: string,
  permission: "read" | "write" | "owner"
) => {
  const access = await sqlite.query.albumPermissions.findFirst({
    where: (ap, { and, eq }) => and(eq(ap.albumId, albumId), eq(ap.userId, userId))
  });

  if (!access) {
    return false;
  }

  if (permission === "read") {
    return true;
  }

  if (permission === "write") {
    return access.permission === "write" || access.permission === "owner";
  }

  return access.permission === permission;
};

export const getAlbumDetails = async (userId: string, albumId: string) => {
  const queryResult = await sqlite
    .select()
    .from(albums)
    .where(eq(albums.id, albumId))
    .innerJoin(
      albumPermissions,
      and(eq(albumPermissions.albumId, albums.id), eq(albumPermissions.userId, userId))
    )
    .innerJoin(
      albumKeys,
      and(eq(albumKeys.albumId, albums.id), eq(albumKeys.userId, userId))
    );
  if (queryResult.length === 0) {
    throw json({ message: "Album not found" }, { status: 404 });
  }

  const [result] = queryResult;

  return {
    album: result.albums,
    permission: result.album_permissions,
    key: result.album_keys
  };
};

export const shareAlbum = async (args: {
  userId: string;
  albumId: string;
  email: string;
  wrappedKey: string;
  permission: "read" | "write";
}) => {
  const { userId, albumId, email, wrappedKey, permission } = args;
  const permissions = await hasAlbumPermission(userId, albumId, "owner");
  if (!permissions) {
    throw json(
      { message: "You do not have permission to share this album" },
      { status: 403 }
    );
  }

  const userToShare = await getUserByEmail(email);

  if (!userToShare) {
    throw json({ message: "User not found" }, { status: 404 });
  }

  const [{ id }] = await sqlite
    .insert(albumInvites)
    .values({
      albumId,
      grantedBy: userId,
      userId: userToShare.id,
      wk: wrappedKey,
      permission
    })
    .returning();
  sendEmail({
    to: email,
    subject: `${userToShare.firstName ? `${userToShare.firstName}, you` : "You"} have been invited to new album`,
    text: `You have been invited to a new album.\nClick here to accept: ${process.env.SITE_URL}/albums/accept-invite/${id}`
  });
};

export const listAlbumMembers = async (albumId: string) => {
  const result = await sqlite.query.albumPermissions.findMany({
    where: (ap, { eq }) => eq(ap.albumId, albumId),
    with: { user: true }
  });
  return result.map((r) => ({
    id: r.id,
    userId: r.userId,
    permission: r.permission,
    firstName: r.user.firstName,
    lastName: r.user.lastName
  }));
};

export const listAlbumInvites = async (albumId: string) => {
  const result = await sqlite.query.albumInvites.findMany({
    where: (ai, { eq }) => eq(ai.albumId, albumId),
    with: { sharedTo: true }
  });
  return result.map((r) => ({
    id: r.id,
    userId: r.userId,
    permission: r.permission,
    firstName: r.sharedTo.firstName,
    lastName: r.sharedTo.lastName
  }));
};

export const revokeAlbumPermission = async (albumId: string, revokeUserId: string) => {
  await sqlite.transaction(async (db) => {
    await db
      .delete(albumPermissions)
      .where(
        and(
          eq(albumPermissions.albumId, albumId),
          eq(albumPermissions.userId, revokeUserId)
        )
      );

    await db
      .delete(albumKeys)
      .where(and(eq(albumKeys.albumId, albumId), eq(albumKeys.userId, revokeUserId)));
  });
};

export const getAlbumInvite = async (inviteId: string, userId: string) => {
  const result = await sqlite
    .select()
    .from(albumInvites)
    .where(and(eq(albumInvites.id, inviteId), eq(albumInvites.userId, userId)))
    .innerJoin(albums, eq(albums.id, albumInvites.albumId))
    .innerJoin(users, eq(users.id, albumInvites.grantedBy));

  if (result.length === 0) {
    return undefined;
  }

  const [{ album_invites, albums: album, users: gratedBy }] = result;

  return {
    invite: album_invites,
    album,
    grantedBy: gratedBy
  };
};
