import express from 'express';
import { createTrack, getTracks, createTeam } from '../controllers/adminController.js';
import { requireAuth, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here require Admin role
router.use(requireAuth, authorizeRoles('admin'));

router.post('/tracks', createTrack);
router.get('/tracks', getTracks);
router.post('/teams', createTeam);

export default router;
