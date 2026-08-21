import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { hashPassword } from '../utils/hash.js';
import { sendMail } from '../utils/mailer.js';
import { generateOTP, setOTP, verifyOTP } from '../utils/otp.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // In legacy ikigai1, users were verified differently.
    const user = await User.findOne({ email });
    if (user && user.password === hashPassword(password)) {
      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email not registered' });
    }

    const otp = generateOTP();
    setOTP(email, otp);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>IKIGAI 2026 Verification</h2>
        <p>Hello ${user.name},</p>
        <p>Your OTP for verification is:</p>
        <h1 style="color: #7b2cbf; letter-spacing: 5px;">${otp}</h1>
        <p>This code is valid for 5 minutes.</p>
      </div>
    `;

    await sendMail({
      to: email,
      subject: 'IKIGAI 2026 - Verification OTP',
      html: htmlContent
    });

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOtpLogin = async (req, res) => {
  const { email, otp } = req.body;
  
  const result = verifyOTP(email, otp);
  if (!result.valid) {
    return res.status(400).json({ success: false, message: result.message });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = hashPassword(newPassword);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
