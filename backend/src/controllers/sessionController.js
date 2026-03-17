import { findUserProfileById } from "../models/userModel.js";
import { revokeSession, getSessionById } from "../models/userSessionModel.js";
import {
  verifyRefreshToken,
  signAccessToken,
  verifyTokenHash,
} from "../services/tokenService.js";

export const getAuthenticatedUser = async (req, res) => {
  const userId = Number(req.auth?.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(401).json({
      message: "Invalid authenticated user context.",
    });
  }

  const db = req.app?.locals?.db;
  if (!db) {
    return res.status(500).json({
      message: "Database client is not initialized.",
    });
  }

  const profile = await findUserProfileById(db, userId);
  if (!profile) {
    return res.status(404).json({
      message: "User was not found.",
    });
  }

  return res.status(200).json({
    message: "Authenticated.",
    user: {
      id: profile.user_id,
      email: profile.email,
      universityId: profile.university_id,
      firstName: profile.fname,
      lastName: profile.lname,
      middleName: profile.mname,
      programId: profile.program_id,
      programCode: profile.program_code,
      programName: profile.program_name,
      roleId: profile.role_id,
      roleName: profile.role_name,
      isActive: profile.is_active,
      lastLogin: profile.last_login,
    },
  });
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.auth?.sessionId;
    const userId = Number(req.auth?.sub);

    if (!sessionId || !Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Invalid session context.",
      });
    }

    const db = req.app?.locals?.db;
    if (!db) {
      return res.status(500).json({
        message: "Database client is not initialized.",
      });
    }

    const revoked = await revokeSession(db, sessionId);
    if (!revoked) {
      return res.status(400).json({
        message: "Failed to revoke session.",
      });
    }

    // Clear refresh token cookie set at login
    res.clearCookie("gra_refresh_token", { path: "/" });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Logout failed",
      error: error.message,
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    // Read refresh token from httpOnly cookie
    const refreshToken = req.cookies?.gra_refresh_token;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token is required.",
      });
    }

    // Verify refresh token signature
    const claims = verifyRefreshToken(refreshToken);

    const db = req.app?.locals?.db;
    if (!db) {
      return res.status(500).json({
        message: "Database client is not initialized.",
      });
    }

    // Verify session exists and is not revoked
    const session = await getSessionById(db, claims.sessionId);
    if (!session) {
      return res.status(401).json({
        message: "Session not found.",
      });
    }

    if (session.is_revoked) {
      return res.status(401).json({
        message: "Session has been revoked.",
      });
    }

    if (new Date(session.expires_at) < new Date()) {
      return res.status(401).json({
        message: "Session has expired.",
      });
    }

    // Verify the refresh token hash matches
    if (!verifyTokenHash(refreshToken, session.refresh_token_hash)) {
      return res.status(401).json({
        message: "Invalid refresh token.",
      });
    }

    // Get user profile for new access token (claims.sub is a string)
    const profile = await findUserProfileById(db, Number(claims.sub));
    if (!profile) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Issue new access token
    const newAccessToken = signAccessToken(profile, claims.sessionId);

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Refresh token has expired.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid refresh token.",
      });
    }

    return res.status(500).json({
      message: "Token refresh failed",
      error: error.message,
    });
  }
};
