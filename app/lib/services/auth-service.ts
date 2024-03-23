import { z } from "zod";
import { eq } from "drizzle-orm";

import { sqlite, authCodes, users, authMethods } from "../sqlite";
import { generateAuthUrl } from "../oauth-providers/google";
import { sendEmail } from "./email-service";

export const getAuthOptions = (state: string) => {
  const authObject = {
    google: {
      on: false,
      url: ""
    },
    email: {
      on: false
    }
  };

  if (process.env.GOOGLE_AUTH === "on") {
    authObject.google = {
      on: true,
      url: generateAuthUrl(state)
    };
  }

  if (process.env.EMAIL_AUTH === "on") {
    authObject.email = {
      on: true
    };
  }

  return authObject;
};

export const emailRegisterStart = async (email: string) => {
  const check = z.string().email().safeParse(email);
  if (check.success === false) {
    throw new Error("Invalid email");
  }
  const authMethod = await sqlite.query.authMethods.findFirst({
    where: (am, { eq, and }) => and(eq(am.type, "email"), eq(am.value, email))
  });
  if (authMethod) {
    throw new Error("Email already registered");
  }
  const authCode = await sqlite
    .insert(authCodes)
    .values({
      metaData: { email, type: "register" }
    })
    .returning();
  await sendEmail({
    to: email,
    subject: "SnapSafe Registration",
    text: `Click the link to complete your SnapSafe registration: ${process.env.SITE_URL}/email-callback?code=${authCode[0].id}&type=register`
  });
};

export const emailRegisterFinish = async (code: string) => {
  const authCode = await sqlite.query.authCodes.findFirst({
    where: (ac, { eq }) => eq(ac.id, code)
  });
  if (!authCode) {
    throw new Error("Invalid code");
  }
  const { email, type } = authCode.metaData;

  if (type !== "register") {
    throw new Error("Invalid code");
  }

  const authMethod = await sqlite.query.authMethods.findFirst({
    where: (am, { eq, and }) => and(eq(am.type, "email"), eq(am.value, email))
  });
  if (authMethod) {
    throw new Error("Email already registered");
  }

  const user = await sqlite.transaction(async (trx) => {
    const [user] = await trx.insert(users).values({}).returning();

    await trx.insert(authMethods).values({
      userId: user.id,
      type: "email",
      value: email
    });

    await trx.delete(authCodes).where(eq(authCodes.id, code));

    return user;
  });

  return user;
};

export const emailSignInStart = async (email: string) => {
  const check = z.string().email().safeParse(email);
  if (check.success === false) {
    throw new Error("Invalid email");
  }
  const authMethod = await sqlite.query.authMethods.findFirst({
    where: (am, { eq, and }) => and(eq(am.type, "email"), eq(am.value, email))
  });
  if (!authMethod) {
    throw new Error("Email not registered");
  }
  const authCode = await sqlite
    .insert(authCodes)
    .values({
      metaData: { email, type: "sign-in" }
    })
    .returning();
  await sendEmail({
    to: email,
    subject: "SnapSafe Sign In",
    text: `Click the link to sign in to SnapSafe: ${process.env.SITE_URL}/email-callback?code=${authCode[0].id}&type=sign-in`
  });
};

export const emailSignInFinish = async (code: string) => {
  const authCode = await sqlite.query.authCodes.findFirst({
    where: (ac, { eq }) => eq(ac.id, code)
  });
  if (!authCode) {
    throw new Error("Invalid code");
  }
  const { email, type } = authCode.metaData;

  if (type !== "sign-in") {
    throw new Error("Invalid code");
  }

  const authMethod = await sqlite.query.authMethods.findFirst({
    where: (am, { eq, and }) => and(eq(am.type, "email"), eq(am.value, email)),
    with: { user: true }
  });
  if (!authMethod || !authMethod.user) {
    throw new Error("Email not registered");
  }

  await sqlite.delete(authCodes).where(eq(authCodes.id, code));

  return authMethod.user;
};

export const googleRegister = async (sub: string, email?: string) => {
  const authMethod = await sqlite.query.authMethods.findFirst({
    where: (am, { eq, and }) => and(eq(am.type, "google"), eq(am.value, sub))
  });
  if (authMethod) {
    throw new Error("Google account already registered");
  }

  const user = await sqlite.transaction(async (trx) => {
    const [user] = await trx.insert(users).values({}).returning();
    type MethodType = typeof authMethods.$inferInsert;
    const methods: MethodType[] = [
      {
        userId: user.id,
        type: "google",
        value: sub
      }
    ];
    if (email) {
      methods.push({
        userId: user.id,
        type: "email",
        value: email
      });
    }
    await trx.insert(authMethods).values(methods);

    return user;
  });

  return user;
};

export const googleSignIn = async (sub: string) => {
  const authMethod = await sqlite.query.authMethods.findFirst({
    where: (am, { eq, and }) => and(eq(am.type, "google"), eq(am.value, sub)),
    with: { user: true }
  });
  if (!authMethod || !authMethod.user) {
    throw new Error("Google account not registered");
  }

  return authMethod.user;
};
