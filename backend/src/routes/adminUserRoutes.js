import { Router } from "express";
import {
  getAdminUserMeta,
  listAdminUsers,
  updateAdminUser,
  createAdminUser,
  revokeAllUserSessions
} from "../controllers/adminUserController.js";
import {
  requireAuth,
  requireRegisteredUser,
} from "../middlewares/authMiddleware.js";

const router = Router();


router.get("/", requireAuth, requireRegisteredUser, listAdminUsers);
router.get("/meta", requireAuth, requireRegisteredUser, getAdminUserMeta);
router.post("/", requireAuth, requireRegisteredUser, createAdminUser);
router.patch("/:userId", requireAuth, requireRegisteredUser, updateAdminUser);
router.post('/:userId/revoke-sessions', requireAuth, requireRegisteredUser, revokeAllUserSessions);

export default router;
