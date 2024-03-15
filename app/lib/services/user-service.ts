import { z } from "zod";
import { eq } from "drizzle-orm";

import { sqlite, users } from "../sqlite";

export const serializeUser = (user: {
  id: string;
  createdOn: Date;
  firstName: string;
  lastName: string;
}) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  createdOn: user.createdOn.getTime()
});

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .optional(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .optional()
});

export const updateUser = async (
  id: string,
  attributes: { firstName?: string; lastName?: string }
) => {
  const data = updateUserSchema.safeParse(attributes);
  if (!data.success) {
    return { errors: data.error.flatten().fieldErrors };
  }
  const [user] = await sqlite
    .update(users)
    .set(data.data)
    .where(eq(users.id, id))
    .returning()
    .execute();

  return serializeUser(user);
};
