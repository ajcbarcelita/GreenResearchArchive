import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client();

const GOOGLE_ISSUERS = new Set([
  "accounts.google.com",
  "https://accounts.google.com",
]);
const DLSU_EMAIL_REGEX = /^[^\s@]+@dlsu\.edu\.ph$/i;

const getGoogleClientIds = () => {
  const rawClientIds = process.env.GOOGLE_CLIENT_ID;

  if (!rawClientIds) {
    const error = new Error("GOOGLE_CLIENT_ID is not configured");
    error.statusCode = 500;
    throw error;
  }

  return rawClientIds
    .split(",")
    .map((clientId) => clientId.trim())
    .filter(Boolean);
};

export const verifyGoogleIdToken = async (idToken) => {
  const audience = getGoogleClientIds();

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      const error = new Error("Invalid Google token payload");
      error.statusCode = 401;
      throw error;
    }

    if (!GOOGLE_ISSUERS.has(payload.iss)) {
      const error = new Error("Untrusted Google token issuer");
      error.statusCode = 401;
      throw error;
    }

    if (!payload.sub || !payload.email || !payload.email_verified) {
      const error = new Error("Google account must have a verified email");
      error.statusCode = 401;
      throw error;
    }

    if (!DLSU_EMAIL_REGEX.test(payload.email)) {
      const error = new Error(
        "Access denied. Only emails ending with @dlsu.edu.ph are allowed.",
      );
      error.statusCode = 403;
      throw error;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (err) {
    throw err;
  }
};
