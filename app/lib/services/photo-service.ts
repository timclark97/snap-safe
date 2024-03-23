import { sqlite } from "../sqlite";

export const listPhotos = async (albumId: string) => {
  const photos = await sqlite.query.photos.findMany({
    where: (photo, { eq }) => eq(photo.albumId, albumId),
    limit: 50
  });

  return photos;
};
