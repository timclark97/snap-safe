import { json } from "@remix-run/node";
import { eq, and } from "drizzle-orm";

import {
  sqlite,
  albumKeys,
  albums,
  albumPermissions,
  albumInvites
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
    where: (ap, { and, eq }) =>
      and(eq(ap.albumId, albumId), eq(ap.userId, userId))
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
      and(
        eq(albumPermissions.albumId, albums.id),
        eq(albumPermissions.userId, userId)
      )
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
    text: `You have been invited to a new album.\nClick here to accept: ${process.env.SITE_URL}/dash/albums/accept-invite/${id}`
  });
};
