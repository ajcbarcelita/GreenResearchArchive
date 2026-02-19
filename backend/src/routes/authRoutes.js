import { Router } from 'express';
import { authenticateWithGoogle } from '../controllers/authController.js';

const router = Router();

router.post('/google', authenticateWithGoogle);

export default router;