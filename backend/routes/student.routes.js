import express from 'express';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();

// Protected with studentCoordinator role
router.use(requireAuth('studentCoordinator'));

router.get('/dashboard', (req, res) => res.json({ message: 'Student Coordinator stub' }));

export default router;
