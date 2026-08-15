import express from 'express';
import { getSessionData, getAssignedTeams, submitAssessment, markAbsent } from '../controllers/evaluator.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth('evaluator', 'judge'));

router.get('/session', getSessionData);
router.get('/teams', getAssignedTeams);
router.patch('/teams/:id/assess', submitAssessment);
router.patch('/teams/:id/absent', markAbsent);

export default router;
