import express from 'express';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();

// Protected with evaluator role
router.use(requireAuth('evaluator'));

router.get('/session', (req, res) => res.json({}));

export default router;
