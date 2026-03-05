import Joi from "joi";
import { verifyGoogleIdToken } from "../services/googleAuthService.js";
import {
  buildOnboardingProfile,
  completeFirstLoginProfile,
  createUserFromOnboarding,
  findGoogleUser,
  getDegreePrograms,
  updateGoogleUserLogin,
} from "../services/userService.js";
import { signAccessToken, signOnboardingToken } from "../services/tokenService.js";

const googleAuthSchema = Joi.object({
  idToken: Joi.string().trim().required(),
});

const completeProfileSchema = Joi.object({
  universityId: Joi.string().trim().pattern(/^\d{8}$/).required(),
  firstName: Joi.string().trim().max(100).required(),
  lastName: Joi.string().trim().max(100).required(),
  middleName: Joi.string().trim().max(100).allow("", null),
  programId: Joi.number().integer().positive().required(),
});

export const authenticateWithGoogle = async (req, res, next) => {
  try {
    const { error, value } = googleAuthSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Invalid request body",
        details: error.details.map((item) => item.message),
      });
    }

    const googleProfile = await verifyGoogleIdToken(value.idToken);
    const dbClient = req.app?.locals?.db;

    const existingUser = await findGoogleUser(dbClient, googleProfile);

    if (existingUser) {
      const user = await updateGoogleUserLogin(dbClient, googleProfile);
      const accessToken = signAccessToken(user);

      return res.status(200).json({
        message: "Google authentication successful",
        accessToken,
        user: {
          id: user.user_id,
          email: user.email,
          universityId: user.university_id,
          firstName: user.fname,
          lastName: user.lname,
          middleName: user.mname,
          programId: user.program_id,
          roleId: user.role_id,
          roleName: user.role_name,
          isActive: user.is_active,
          lastLogin: user.last_login,
        },
      });
    }

    const onboardingProfile = buildOnboardingProfile(googleProfile);
    const accessToken = signOnboardingToken(onboardingProfile);

    return res.status(200).json({
      message: "Google authentication successful",
      accessToken,
      user: {
        id: null,
        email: onboardingProfile.email,
        universityId: null,
        firstName: googleProfile.givenName || null,
        lastName: googleProfile.familyName || null,
        middleName: null,
        programId: null,
        roleId: null,
        roleName: onboardingProfile.roleName,
        isActive: true,
        lastLogin: null,
      },
    });
  } catch (authError) {
    if (authError?.statusCode) {
      return res.status(authError.statusCode).json({
        message: authError.message,
      });
    }

    return next(authError);
  }
};

export const getAuthenticatedUser = async (req, res) => {
  return res.status(200).json({
    message: "Authenticated",
    auth: req.auth,
  });
};

export const logout = async (req, res) => {
  return res.status(200).json({
    message: "Logout successful",
  });
};

export const listDegreePrograms = async (req, res, next) => {
  try {
    const dbClient = req.app?.locals?.db;
    const programs = await getDegreePrograms(dbClient);

    return res.status(200).json({
      message: "Degree programs fetched",
      programs,
    });
  } catch (error) {
    return next(error);
  }
};

export const completeProfile = async (req, res, next) => {
  try {
    const { error, value } = completeProfileSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Invalid request body",
        details: error.details.map((item) => item.message),
      });
    }

    const dbClient = req.app?.locals?.db;
    let updatedUser;

    if (req.auth?.onboardingRequired) {
      if (!req.auth?.googleId || !req.auth?.email) {
        return res.status(401).json({
          message: "Invalid onboarding session.",
        });
      }

      updatedUser = await createUserFromOnboarding(dbClient, {
        googleId: req.auth.googleId,
        email: String(req.auth.email).toLowerCase(),
        universityId: value.universityId.trim(),
        firstName: value.firstName,
        lastName: value.lastName,
        middleName: value.middleName || null,
        programId: value.programId,
      });
    } else {
      const userId = Number(req.auth?.sub);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(401).json({
          message: "Invalid authenticated user context.",
        });
      }

      updatedUser = await completeFirstLoginProfile(dbClient, {
        userId,
        universityId: value.universityId.trim(),
        firstName: value.firstName,
        lastName: value.lastName,
        middleName: value.middleName || null,
        programId: value.programId,
      });
    }

    const accessToken = signAccessToken(updatedUser);

    return res.status(200).json({
      message: "Profile completed",
      accessToken,
      user: {
        id: updatedUser.user_id,
        email: updatedUser.email,
        universityId: updatedUser.university_id,
        firstName: updatedUser.fname,
        lastName: updatedUser.lname,
        middleName: updatedUser.mname,
        programId: updatedUser.program_id,
        roleId: updatedUser.role_id,
        roleName: updatedUser.role_name,
        isActive: updatedUser.is_active,
        lastLogin: updatedUser.last_login,
      },
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }
    return next(error);
  }
};
