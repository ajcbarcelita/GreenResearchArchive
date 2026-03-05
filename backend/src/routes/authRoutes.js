import { Router } from "express";
import loginRoutes from "./loginRoutes.js";
import onboardingRoutes from "./onboardingRoutes.js";
import sessionRoutes from "./sessionRoutes.js";

const router = Router();

// Grouped by frontend usage while keeping endpoint paths unchanged under /api/auth/*
router.use(loginRoutes);
router.use(sessionRoutes);
router.use(onboardingRoutes);

export default router;
