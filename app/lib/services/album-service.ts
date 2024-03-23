import { json } from "@remix-run/node";
import { eq, and } from "drizzle-orm";

import {
  sqlite,
  albumKeys,
  albums,
  albumPermissions,
  photos
} from "@/lib/sqlite";

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
      .returning()
      .execute();

    const [albumKey] = await db
      .insert(albumKeys)
      .values({
        userId: userId,
        albumId: album.id,
        key,
        iv
      })
      .returning()
      .execute();

    await db
      .insert(albumPermissions)
      .values({
        userId: userId,
        albumId: album.id,
        permission: "owner",
        grantedBy: userId
      })
      .execute();

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

export const loadAlbum = async (userId: string, albumId: string) => {
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
    )
    .execute();

  if (queryResult.length === 0) {
    throw json({ message: "Album not found" }, { status: 404 });
  }

  const [result] = queryResult;

  const albumPhotos = await sqlite
    .select()
    .from(photos)
    .where(eq(photos.albumId, result.albums.id))
    .limit(50)
    .execute();

  return {
    album: result.albums,
    permission: result.album_permissions,
    photos: albumPhotos,
    key: result.album_keys
  };
};
