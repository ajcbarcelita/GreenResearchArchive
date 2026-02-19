import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client();

const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

const getGoogleClientIds = () => {
  const rawClientIds = process.env.GOOGLE_CLIENT_ID;

  if (!rawClientIds) {
    const error = new Error('GOOGLE_CLIENT_ID is not configured');
    error.statusCode = 500;
    throw error;
  }

  return rawClientIds
    .split(',')
    .map((clientId) => clientId.trim())
    .filter(Boolean);
};

export const verifyGoogleIdToken = async (idToken) => {
  const audience = getGoogleClientIds();

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    const error = new Error('Invalid Google token payload');
    error.statusCode = 401;
    throw error;
  }

  if (!GOOGLE_ISSUERS.has(payload.iss)) {
    const error = new Error('Untrusted Google token issuer');
    error.statusCode = 401;
    throw error;
  }

  if (!payload.sub || !payload.email || !payload.email_verified) {
    const error = new Error('Google account must have a verified email');
    error.statusCode = 401;
    throw error;
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified,
    name: payload.name ?? '',
    givenName: payload.given_name ?? '',
    familyName: payload.family_name ?? '',
    picture: payload.picture ?? null,
  };
};