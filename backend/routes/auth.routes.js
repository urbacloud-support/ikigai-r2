import express from 'express';
import jwt from 'jsonwebtoken';
import { ROLES } from '../../frontend/src/config/constants.js'; // Reusing constant
import Evaluator from '../models/Evaluator.js';
import Judge from '../models/Judge.js';
import StudentCoordinator from '../models/StudentCoordinator.js';
import TeamLeader from '../models/TeamLeader.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Note: For Phase 8 we are bypassing bcrypt for simplicity until we implement signup
        // Normally you'd use bcrypt.compare()
        
        let user;
        if (role === ROLES.ADMIN) {
            // Admin is hardcoded in .env
            if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
                user = { _id: 'admin_id', email, name: 'Super Admin' };
            }
        } else if (role === ROLES.EVALUATOR) {
            user = await Evaluator.findOne({ email, password, isActive: true });
        } else if (role === ROLES.JUDGE) {
            user = await Judge.findOne({ email, password, isActive: true });
        } else if (role === ROLES.STUDENT_COORDINATOR) {
            user = await StudentCoordinator.findOne({ email, password, isActive: true });
        } else if (role === ROLES.TEAM_LEADER) {
            user = await TeamLeader.findOne({ email, password });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials or account disabled' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, role, email: user.email, name: user.name });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
