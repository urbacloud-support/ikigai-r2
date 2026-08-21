const otpStore = new Map();

/**
 * Generates a 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Stores an OTP with a 5-minute expiry
 */
export const setOTP = (email, otp) => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(email.toLowerCase(), { otp, expiresAt });
};

/**
 * Verifies an OTP.
 * Returns { valid: true/false, message: '...' }
 */
export const verifyOTP = (email, otpInput) => {
  const key = email.toLowerCase();
  const record = otpStore.get(key);

  if (!record) {
    return { valid: false, message: 'OTP expired or lost due to server restart. Please request a new OTP.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (record.otp !== otpInput) {
    return { valid: false, message: 'Invalid OTP' };
  }

  // OTP is valid, remove it from store to prevent reuse
  otpStore.delete(key);
  return { valid: true, message: 'OTP verified successfully' };
};
