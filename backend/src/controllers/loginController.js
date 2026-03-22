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
  signRefreshToken,
  hashToken,
} from "../services/tokenService.js";
import { createSession } from "../models/userSessionModel.js";

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

      // Create session for refresh token
      const userAgent = req.headers["user-agent"] || "Unknown Device";
      const ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "Unknown IP";
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const session = await createSession(
        dbClient,
        user.user_id,
        hashToken(""), // Temporary hash, will update with real refresh token hash after signing
        userAgent,
        ipAddress,
        expiresAt,
      );

      const refreshToken = signRefreshToken(user.user_id, session.session_id);
      const refreshTokenHash = hashToken(refreshToken);

      // Update session with actual refresh token hash
      await dbClient.query(
        `UPDATE user_sessions SET refresh_token_hash = $1 WHERE session_id = $2`,
        [refreshTokenHash, session.session_id],
      );

      const accessToken = signAccessToken(user, session.session_id);

      // set refresh token as httpOnly cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      };

      res.cookie("gra_refresh_token", refreshToken, cookieOptions);

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
