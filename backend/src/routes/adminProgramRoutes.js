import { Router } from "express";
import {
  createProgram,
  deleteProgram,
  listPrograms,
  updateProgram,
} from "../controllers/adminProgramController.js";
import {
  requireAuth,
  requireRegisteredUser,
} from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, requireRegisteredUser, listPrograms);
router.post("/", requireAuth, requireRegisteredUser, createProgram);
router.patch("/:programId", requireAuth, requireRegisteredUser, updateProgram);
router.delete("/:programId", requireAuth, requireRegisteredUser, deleteProgram);

export default router;
