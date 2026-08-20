import express from 'express';
import { 
  getEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  updateEventCriteria, 
  getEventEvaluators, 
  lockAllEvaluators,
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  assignEvaluator, 
  toggleEvaluatorLock,
  getTeams,
  getGlobalTracks 
} from '../controllers/admin.controller.js';
import { startTimer, stopTimer, resetTimer, getTimerStatus } from '../controllers/timer.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth('admin'));

// --- Events ---
router.route('/events')
  .get(getEvents)
  .post(createEvent);

router.route('/events/:id')
  .put(updateEvent)
  .delete(deleteEvent);

router.put('/events/:id/criteria', updateEventCriteria);
router.get('/events/:id/evaluators', getEventEvaluators);
router.patch('/events/:id/lock-all', lockAllEvaluators);

// --- Users ---
router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

router.put('/users/:id/assign', assignEvaluator);
router.patch('/users/:id/lock', toggleEvaluatorLock);

// --- Teams ---
router.get('/teams', getTeams);

// --- Tracks ---
router.get('/tracks', getGlobalTracks);

// --- Hackathon Timer (admin write endpoints) ---
router.get('/timer/status', getTimerStatus);
router.post('/timer/start', startTimer);
router.post('/timer/stop', stopTimer);
router.post('/timer/reset', resetTimer);

export default router;
