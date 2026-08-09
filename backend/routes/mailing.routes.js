import express from 'express';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();

router.use(requireAuth('admin'));

router.post('/send-bulk', (req, res) => res.json({ message: 'Mailing stub' }));

export default router;
