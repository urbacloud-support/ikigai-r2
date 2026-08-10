import express from 'express';
import { getAssignedTeams, submitAssessment } from '../controllers/evaluator.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth('evaluator', 'judge'));

router.get('/teams', getAssignedTeams);
router.patch('/teams/:id/assess', submitAssessment);

export default router;
