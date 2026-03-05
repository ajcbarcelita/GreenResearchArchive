import Joi from "joi";
import {
  completeFirstLoginProfile,
  createUserFromOnboarding,
  getDegreePrograms,
} from "../services/userService.js";
import { signAccessToken } from "../services/tokenService.js";

const completeProfileSchema = Joi.object({
  universityId: Joi.string().trim().pattern(/^\d{8}$/).required(),
  firstName: Joi.string().trim().max(100).required(),
  lastName: Joi.string().trim().max(100).required(),
  middleName: Joi.string().trim().max(100).allow("", null),
  programId: Joi.number().integer().positive().required(),
});

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
