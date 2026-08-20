import * as timerService from '../utils/timerService.js';

/**
 * POST /api/admin/timer/start
 * Protected by requireAuth('admin')
 * Starts the 36-hour hackathon timer.
 */
export const startTimer = async (req, res) => {
  try {
    // Prevent double-starting: if already running, reject
    const current = timerService.getStatus();
    if (current.status === 'running') {
      return res.status(400).json({
        success: false,
        message: 'Timer is already running. Stop or reset it first.'
      });
    }

    const status = await timerService.startTimer(req.user._id.toString());
    res.json({ success: true, message: 'Hackathon timer started.', timer: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/admin/timer/stop
 * Protected by requireAuth('admin')
 * Manually stops the timer before it expires.
 */
export const stopTimer = async (req, res) => {
  try {
    const current = timerService.getStatus();
    if (current.status !== 'running') {
      return res.status(400).json({
        success: false,
        message: 'Timer is not currently running.'
      });
    }

    const status = await timerService.stopTimer();
    res.json({ success: true, message: 'Hackathon timer stopped.', timer: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/admin/timer/reset
 * Protected by requireAuth('admin')
 * Resets the timer to initial state (clears DB doc, clears RAM).
 */
export const resetTimer = async (req, res) => {
  try {
    const status = await timerService.resetTimer();
    res.json({ success: true, message: 'Hackathon timer reset.', timer: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/timer/status  (JWT-protected, for admin widget)
 * GET /api/timer/status        (API-key-protected, for R1 team leaders)
 * Returns current timer status. Pure RAM read — no DB query.
 */
export const getTimerStatus = (req, res) => {
  try {
    const status = timerService.getStatus();
    res.json({ success: true, timer: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
