import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { authMethods, sqlite, users } from "../sqlite";

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
    throw new Error("User data is invalid");
  }
  const [user] = await sqlite
    .update(users)
    .set(data.data)
    .where(eq(users.id, id))
    .returning()
    .execute();

  return user;
};

export const getUserByEmail = async (email: string) => {
  const result = await sqlite
    .select()
    .from(authMethods)
    .where(and(eq(authMethods.value, email), eq(authMethods.type, "email")))
    .innerJoin(users, eq(users.id, authMethods.userId))
    .execute();

  if (result.length === 0) {
    return null;
  }

  const [{ users: user }] = result;

  return user;
};
