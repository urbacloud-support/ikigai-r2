import express from 'express';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();

// Protected with judge role
router.use(requireAuth('judge'));

router.get('/dashboard', (req, res) => res.json({ message: 'Judge stub' }));

export default router;
