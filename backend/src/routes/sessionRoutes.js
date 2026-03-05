import { Router } from "express";
import {
  getAuthenticatedUser,
  logout,
} from "../controllers/sessionController.js";
import {
  requireAuth,
  requireRegisteredUser,
} from "../middlewares/authMiddleware.js";

const router = Router();

// Used by frontend auth/session checks and logout
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, requireRegisteredUser, getAuthenticatedUser);

export default router;
