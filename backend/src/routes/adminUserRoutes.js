import { Router } from "express";
import {
  getAdminUserMeta,
  listAdminUsers,
  updateAdminUser,
} from "../controllers/adminUserController.js";
import {
  requireAuth,
  requireRegisteredUser,
} from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, requireRegisteredUser, listAdminUsers);
router.get("/meta", requireAuth, requireRegisteredUser, getAdminUserMeta);
router.patch("/:userId", requireAuth, requireRegisteredUser, updateAdminUser);

export default router;
