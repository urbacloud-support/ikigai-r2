/**
 * Middleware: validates X-Timer-Key header against TIMER_API_KEY env var.
 * Used on the public timer status endpoint to prevent unauthorized access.
 */
export const requireTimerKey = (req, res, next) => {
  const key = req.headers['x-timer-key'];
  if (!key || key !== process.env.TIMER_API_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid timer key' });
  }
  next();
};
