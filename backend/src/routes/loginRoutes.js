import { Router } from "express";
import { authenticateWithGoogle } from "../controllers/loginController.js";

const router = Router();

// Used by frontend LoginView.vue
router.post("/google", authenticateWithGoogle);

export default router;
