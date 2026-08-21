import express from 'express';
import { login, sendOtp, verifyOtpLogin, updatePassword } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp-login', verifyOtpLogin);
router.put('/update-password', requireAuth(), updatePassword);

export default router;
