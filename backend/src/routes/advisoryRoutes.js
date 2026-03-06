import express from "express";
import { getAdvisoryLoad } from "../controllers/advisoryController.js";

const router = express.Router();

// GET /api/advisory/load -> advisory load rows + summary
router.get("/load", getAdvisoryLoad);

export default router;
