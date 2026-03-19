import { Router } from "express";
import {
  deleteCurrentStudentSubmissionFile,
  generateCurrentStudentSubmissionSummary,
  getCurrentStudentSubmission,
  getLatestStudentSubmission,
  getStudentTasks,
  saveCurrentStudentSubmission,
  submitCurrentStudentSubmission,
  uploadCurrentStudentSubmissionFile,
} from "../controllers/studentSubmissionController.js";
import {
  requireAuth,
  requireRegisteredUser,
} from "../middlewares/authMiddleware.js";

const router = Router();

router.get(
  "/student/current",
  requireAuth,
  requireRegisteredUser,
  getCurrentStudentSubmission,
);
router.get(
  "/student/latest",
  requireAuth,
  requireRegisteredUser,
  getLatestStudentSubmission,
);
router.get(
  "/student/tasks",
  requireAuth,
  requireRegisteredUser,
  getStudentTasks,
);
router.put(
  "/student/current",
  requireAuth,
  requireRegisteredUser,
  saveCurrentStudentSubmission,
);
router.post(
  "/student/current/submit",
  requireAuth,
  requireRegisteredUser,
  submitCurrentStudentSubmission,
);
router.post(
  "/student/current/files",
  requireAuth,
  requireRegisteredUser,
  uploadCurrentStudentSubmissionFile,
);
router.post(
  "/student/current/summary",
  requireAuth,
  requireRegisteredUser,
  generateCurrentStudentSubmissionSummary,
);
router.delete(
  "/student/current/files/:fileId",
  requireAuth,
  requireRegisteredUser,
  deleteCurrentStudentSubmissionFile,
);

export default router;
