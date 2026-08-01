import express from 'express';
import { createTrack, getTracks, createTeam, getTeams, createEvent, getEvents } from '../controllers/adminController.js';
import { requireAuth, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Allow all authenticated users (including team leaders) to fetch tracks
router.get('/tracks', requireAuth, getTracks);

// Require Admin role for creation routes
router.use(requireAuth, authorizeRoles('admin'));

router.post('/tracks', createTrack);
router.post('/teams', createTeam);
router.get('/teams', getTeams);
router.post('/events', createEvent);
router.get('/events', getEvents);

export default router;
