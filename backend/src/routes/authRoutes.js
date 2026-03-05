import { Router } from "express";
import {
	authenticateWithGoogle,
	completeProfile,
	getAuthenticatedUser,
	logout,
	listDegreePrograms,
} from "../controllers/authController.js";
import { requireAuth, requireRegisteredUser } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/google", authenticateWithGoogle);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, requireRegisteredUser, getAuthenticatedUser);
router.get("/programs", requireAuth, listDegreePrograms);
router.post("/complete-profile", requireAuth, completeProfile);

export default router;
