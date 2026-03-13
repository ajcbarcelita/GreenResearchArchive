import express from "express";
import {
  listRepository,
  getRepositoryById,
} from "../controllers/repositoryController.js";

const router = express.Router();

// GET /api/repository  -> list
router.get("/", listRepository);

// GET /api/repository/:id -> details
router.get("/:id", getRepositoryById);

export default router;
