import { z } from "zod";

export const emailAuthValidator = (fd: FormData) => {
  const email = fd.get("email")?.toString();
  return z.string().email().safeParse(email);
};
