import Joi from 'joi';
import { verifyGoogleIdToken } from '../services/googleAuthService.js';

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
        message: 'Invalid request body',
        details: error.details.map((item) => item.message),
      });
    }

    const user = await verifyGoogleIdToken(value.idToken);

    return res.status(200).json({
      message: 'Google authentication successful',
      user,
    });
  } catch (authError) {
    return next(authError);
  }
};