import { sqlite, albumKeys, albums, albumPermissions } from "@/lib/sqlite";

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
