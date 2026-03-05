import Joi from "joi";
import { verifyGoogleIdToken } from "../services/googleAuthService.js";
import {
  buildOnboardingProfile,
  findGoogleUser,
  updateGoogleUserLogin,
} from "../services/userService.js";
import {
  signAccessToken,
  signOnboardingToken,
} from "../services/tokenService.js";

const googleAuthSchema = Joi.object({
  idToken: Joi.string().trim().required(),
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
