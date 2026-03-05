import { Router } from "express";
import { completeProfile, listDegreePrograms } from "../controllers/onboardingController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// Used by frontend CompleteProfileView.vue and ProfileView.vue
router.get("/programs", listDegreePrograms);
router.post("/complete-profile", requireAuth, completeProfile);

export default router;
