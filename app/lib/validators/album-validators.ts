import { z } from "zod";

export const createAlbumValidator = (fd: FormData) => {
  const data = Object.fromEntries(fd.entries());
  return z
    .object({
      name: z
        .string()
        .min(2, { message: "Album name must be at least 2 characters long." }),
      description: z.string().optional(),
      iv: z.string(),
      key: z.string()
    })
    .safeParse(data);
};
