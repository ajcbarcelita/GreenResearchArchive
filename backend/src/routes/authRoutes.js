import { Router } from "express";
import {
	authenticateWithGoogle,
	getAuthenticatedUser,
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/google", authenticateWithGoogle);
router.get("/me", requireAuth, getAuthenticatedUser);

export default router;
