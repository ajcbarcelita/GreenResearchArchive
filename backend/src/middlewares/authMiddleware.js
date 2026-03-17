import { verifyAccessToken } from "../services/tokenService.js";
import { getSessionById } from "../models/userSessionModel.js";

const extractBearerToken = (authorizationHeader = "") => {
  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim();
};

export const requireAuth = async (req, res, next) => {
  try {
    const rawAuthHeader = req.headers.authorization || "";
    const token = extractBearerToken(rawAuthHeader);

    if (!token) {
      return res.status(401).json({
        message: "Missing or invalid Authorization header. Use Bearer <token>.",
      });
    }

    const claims = verifyAccessToken(token);

    // Optional: Check if session has been revoked in database
    // This adds a DB query to every request but provides stricter revocation
    // For 15m access tokens, signature expiration is usually sufficient
    if (claims.sessionId) {
      const db = req.app?.locals?.db;
      if (db) {
        const session = await getSessionById(db, claims.sessionId);
        if (!session || session.is_revoked) {
          return res.status(401).json({
            message: "Session has been revoked.",
          });
        }
      }
    }

    req.auth = claims;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired access token.",
    });
  }
};

export const requireRegisteredUser = (req, res, next) => {
  if (req.auth?.onboardingRequired) {
    return res.status(403).json({
      message: "Complete your profile first to access this resource.",
    });
  }

  return next();
};
