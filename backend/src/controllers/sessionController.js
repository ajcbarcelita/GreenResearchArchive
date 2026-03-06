import { findUserProfileById } from "../models/userModel.js";

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
    message: "Authenticated",
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
  return res.status(200).json({
    message: "Logout successful",
  });
};
