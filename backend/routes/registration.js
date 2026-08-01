import express from 'express';
import { submitRegistration } from '../controllers/registrationController.js';
import { requireAuth, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only Team Leaders can submit registration
router.post('/', requireAuth, authorizeRoles('teamLeader'), submitRegistration);

export default router;
