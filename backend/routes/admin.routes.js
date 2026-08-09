import express from 'express';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();

// Protected with admin role
router.use(requireAuth('admin'));

router.get('/events', (req, res) => res.json([]));

export default router;
