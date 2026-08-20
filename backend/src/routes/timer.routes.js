import express from 'express';
import { getTimerStatus } from '../controllers/timer.controller.js';
import { requireTimerKey } from '../middleware/requireTimerKey.js';

const router = express.Router();

// GET /api/timer/status — protected by API key (not JWT)
// Used by R1 team leader dashboard to poll countdown
router.get('/status', requireTimerKey, getTimerStatus);

export default router;
