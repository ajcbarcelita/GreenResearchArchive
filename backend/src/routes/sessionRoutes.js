import { Router } from "express";
import {
  getAuthenticatedUser,
  logout,
  refreshAccessToken,
} from "../controllers/sessionController.js";
import {
  requireAuth,
  requireRegisteredUser,
} from "../middlewares/authMiddleware.js";

const router = Router();

// Used by frontend auth/session checks and logout
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, requireRegisteredUser, getAuthenticatedUser);

// Token refresh endpoint, does NOT require auth header, takes refresh token in body
router.post("/refresh", refreshAccessToken);

export default router;
