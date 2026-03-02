import Joi from "joi";
import { verifyGoogleIdToken } from "../services/googleAuthService.js";

const googleAuthSchema = Joi.object({
  idToken: Joi.string().trim().required(),
});

export const authenticateWithGoogle = async (req, res, next) => {
  console.log('AUTH REQUEST RECEIVED');
  
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

    console.log('VALIDATING TOKEN');
    const user = await verifyGoogleIdToken(value.idToken);
    console.log('AUTH SUCCESS');

    return res.status(200).json({
      message: "Google authentication successful",
      user,
    });
  } catch (authError) {
    console.log('AUTH CONTROLLER CATCH:', authError.message);
    return next(authError);
  }
};
