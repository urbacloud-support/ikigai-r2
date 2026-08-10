import express from 'express';
import { getEvents, createEvent, getUsers, getGlobalTracks } from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth('admin'));

router.route('/events')
  .get(getEvents)
  .post(createEvent);

router.get('/users', getUsers);
router.get('/tracks', getGlobalTracks);

export default router;
