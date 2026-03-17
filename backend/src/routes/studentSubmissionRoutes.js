import { Router } from "express";
import {
  deleteCurrentStudentSubmissionFile,
  getCurrentStudentSubmission,
  saveCurrentStudentSubmission,
  submitCurrentStudentSubmission,
  uploadCurrentStudentSubmissionFile,
} from "../controllers/studentSubmissionController.js";
import {
  requireAuth,
  requireRegisteredUser,
} from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/student/current", requireAuth, requireRegisteredUser, getCurrentStudentSubmission);
router.put("/student/current", requireAuth, requireRegisteredUser, saveCurrentStudentSubmission);
router.post("/student/current/submit", requireAuth, requireRegisteredUser, submitCurrentStudentSubmission);
router.post("/student/current/files", requireAuth, requireRegisteredUser, uploadCurrentStudentSubmissionFile);
router.delete("/student/current/files/:fileId", requireAuth, requireRegisteredUser, deleteCurrentStudentSubmissionFile);

export default router;
