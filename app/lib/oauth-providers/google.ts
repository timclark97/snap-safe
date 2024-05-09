import { OAuth2Client } from "google-auth-library";

if (
  process.env.GOOGLE_AUTH === "on" &&
  (!process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REDIRECT_URI ||
    !process.env.SITE_URL)
) {
  throw new Error(
    "Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, or SITE_URL"
  );
}

const oauthClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.SITE_URL! + process.env.GOOGLE_REDIRECT_URI!
});

export const generateAuthUrl = (state?: string) => {
  return oauthClient.generateAuthUrl({
    access_type: "online",
    scope: ["https://www.googleapis.com/auth/userinfo.email"],
    state
  });
};

export const getDataFromCallback = async (url: string) => {
  const urlObject = new URL(url);
  const code = urlObject.searchParams.get("code");
  const state = urlObject.searchParams.get("state");

  if (!code || !state) {
    throw new Error("Something went wrong. Please try again.");
  }

  const { tokens } = await oauthClient.getToken(code);

  if (!tokens.id_token) {
    throw new Error("Something went wrong. Please try again.");
  }

  const payload = await oauthClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const idTokenBody = payload.getPayload();

  if (!idTokenBody) {
    throw new Error("Something went wrong. Please try again.");
  }

  return { idToken: idTokenBody, state };
};
