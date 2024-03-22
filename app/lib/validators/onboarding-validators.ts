import { z } from "zod";

export const nameValidator = (fd: FormData) => {
  const data = Object.fromEntries(fd.entries());
  return z
    .object({
      firstName: z
        .string()
        .min(2, { message: "First name must be at least 2 characters long." }),
      lastName: z
        .string()
        .min(2, { message: "Last name must be at least 2 characters long." })
    })
    .safeParse(data);
};

export const setPasswordValidator = (fd: FormData) => {
  const data = Object.fromEntries(fd.entries());
  return z
    .object({
      puK: z.string(),
      prK: z.string(),
      prKIv: z.string(),
      mkS: z.string(),
      mkT: z.string(),
      mkTIv: z.string()
    })
    .safeParse(data);
};
