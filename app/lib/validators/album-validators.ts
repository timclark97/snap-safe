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

export const shareAlbumLoadValidator = (sp: URLSearchParams) => {
  const data = Object.fromEntries(sp.entries());
  return z
    .object({
      email: z.string().optional(),
      grantedPermission: z.enum(["read", "write"]).optional()
    })
    .safeParse(data);
};

export const shareAlbumActionValidator = (fd: FormData) => {
  const data = Object.fromEntries(fd.entries());
  return z
    .object({
      email: z.string().email({ message: "Invalid email address" }),
      key: z.string(),
      grantedPermission: z.enum(["read", "write"])
    })
    .safeParse(data);
};

export const acceptAlbumInviteValidator = (fd: FormData) => {
  const data = Object.fromEntries(fd.entries());
  return z
    .object({
      key: z.string(),
      iv: z.string()
    })
    .safeParse(data);
};
