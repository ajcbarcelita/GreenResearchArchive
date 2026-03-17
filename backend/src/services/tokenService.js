import jwt from "jsonwebtoken";
import crypto from "crypto";

const getJwtConfig = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

  if (!secret) {
    const error = new Error("JWT_ACCESS_SECRET is not configured");
    error.statusCode = 500;
    throw error;
  }

  return { secret, expiresIn };
};

const getRefreshJwtConfig = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

  if (!secret) {
    const error = new Error("JWT_REFRESH_SECRET is not configured");
    error.statusCode = 500;
    throw error;
  }

  return { secret, expiresIn };
};

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifyTokenHash = (plainToken, hash) => {
  const computed = hashToken(plainToken);
  return computed === hash;
};

export const signAccessToken = (user, sessionId) => {
  const { secret, expiresIn } = getJwtConfig();

  const payload = {
    sub: String(user.user_id),
    sessionId,
    email: user.email,
    roleId: user.role_id,
    roleName: user.role_name,
  };

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyAccessToken = (token) => {
  const { secret } = getJwtConfig();
  return jwt.verify(token, secret);
};

export const signRefreshToken = (userId, sessionId) => {
  const { secret, expiresIn } = getRefreshJwtConfig();

  const payload = {
    sub: String(userId),
    sessionId,
    type: "refresh",
  };

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyRefreshToken = (token) => {
  const { secret } = getRefreshJwtConfig();
  return jwt.verify(token, secret);
};

export const signOnboardingToken = (profile) => {
  const { secret } = getJwtConfig();
  const expiresIn = process.env.JWT_ONBOARDING_EXPIRES_IN || "30m";

  const payload = {
    sub: `onboarding:${profile.googleId}`,
    onboardingRequired: true,
    googleId: profile.googleId,
    email: profile.email,
    roleName: profile.roleName,
    name: profile.name,
    givenName: profile.givenName,
    familyName: profile.familyName,
  };

  return jwt.sign(payload, secret, { expiresIn });
};
