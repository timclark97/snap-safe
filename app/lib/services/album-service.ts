import { eq, and } from "drizzle-orm";

import { albumKeys, albumPermissions, sqlite } from "@/lib/sqlite";

export const getAlbumAccess = async (userId: string, albumId: string) => {
  const result = await sqlite
    .select()
    .from(albumPermissions)
    .where(
      and(
        eq(albumPermissions.albumId, albumId),
        eq(albumPermissions.userId, userId)
      )
    )
    .innerJoin(
      albumKeys,
      and(eq(albumKeys.albumId, albumId), eq(albumKeys.userId, userId))
    )
    .execute();

  if (result.length === 0) {
    return undefined;
  }

  return { permission: result[0].album_permissions, key: result[0].album_keys };
};

export const hasWriteAccess = async (userId: string, albumId: string) => {
  const permission = sqlite.query.albumPermissions.findFirst({
    where: (ap, { eq, and, or }) =>
      and(
        eq(ap.albumId, albumId),
        eq(ap.userId, userId),
        or(eq(ap.permission, "owner"), eq(ap.permission, "write"))
      )
  });

  if (!permission) {
    return false;
  }

  return true;
};
