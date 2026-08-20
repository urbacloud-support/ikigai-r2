import HackathonTimer from '../models/HackathonTimer.js';

const DURATION_MS = 36 * 60 * 60 * 1000; // 129,600,000 ms = 36 hours

// In-memory state — lives in process RAM
let timerState = {
  startedAt: null,    // JS Date object, set when timer starts
  durationMs: DURATION_MS,
  status: 'stopped'   // 'running' | 'stopped' | 'expired'
};

/**
 * Returns current timer status computed entirely from RAM.
 * Zero database reads.
 * @returns {{ status: string, remainingMs: number, totalMs: number, startedAt: Date|null }}
 */
export function getStatus() {
  if (timerState.status === 'running' && timerState.startedAt) {
    const elapsed = Date.now() - timerState.startedAt.getTime();
    const remainingMs = timerState.durationMs - elapsed;

    if (remainingMs <= 0) {
      // Auto-expire: update both RAM and DB asynchronously
      timerState.status = 'expired';
      HackathonTimer.findOneAndUpdate(
        {},
        { status: 'expired' },
        { sort: { createdAt: -1 } }
      ).catch(() => {}); // Fire-and-forget, non-blocking

      return {
        status: 'expired',
        remainingMs: 0,
        totalMs: timerState.durationMs,
        startedAt: timerState.startedAt
      };
    }

    return {
      status: 'running',
      remainingMs,
      totalMs: timerState.durationMs,
      startedAt: timerState.startedAt
    };
  }

  return {
    status: timerState.status, // 'stopped' or 'expired'
    remainingMs: 0,
    totalMs: DURATION_MS,
    startedAt: timerState.startedAt
  };
}

/**
 * Starts the timer. Persists startedAt to MongoDB for crash recovery.
 * @param {string} userId - ObjectId string of the admin who started it
 * @returns {Promise<object>} The new status object
 */
export async function startTimer(userId) {
  // Delete any previous timer doc to keep collection clean (singleton)
  await HackathonTimer.deleteMany({});

  const now = new Date();
  timerState = {
    startedAt: now,
    durationMs: DURATION_MS,
    status: 'running'
  };

  // Persist to MongoDB (for restart recovery)
  await HackathonTimer.create({
    startedAt: now,
    durationMs: DURATION_MS,
    status: 'running',
    startedBy: userId
  });

  return getStatus();
}

/**
 * Stops the timer manually. Persists stop to MongoDB.
 * @returns {Promise<object>} The new status object
 */
export async function stopTimer() {
  timerState.status = 'stopped';

  await HackathonTimer.findOneAndUpdate(
    {},
    { status: 'stopped', stoppedAt: new Date() },
    { sort: { createdAt: -1 } }
  );

  return getStatus();
}

/**
 * Resets the timer. Clears RAM state and deletes MongoDB doc.
 * @returns {Promise<object>} The new status object
 */
export async function resetTimer() {
  timerState = {
    startedAt: null,
    durationMs: DURATION_MS,
    status: 'stopped'
  };

  await HackathonTimer.deleteMany({});

  return getStatus();
}

/**
 * Called ONCE on server boot (after DB connects).
 * Reads MongoDB to restore in-memory state after a Railway redeploy/restart.
 * If a timer was running and hasn't expired yet, it restores it to RAM.
 * If it expired while the server was down, it marks it expired in DB.
 */
export async function rehydrateTimer() {
  try {
    const doc = await HackathonTimer.findOne({ status: 'running' }).sort({ createdAt: -1 });

    if (!doc) {
      console.log('[TimerService] No active timer found in DB. Starting fresh.');
      return;
    }

    const elapsed = Date.now() - doc.startedAt.getTime();
    const remainingMs = doc.durationMs - elapsed;

    if (remainingMs <= 0) {
      // Timer expired while server was down — mark it in DB
      await HackathonTimer.findByIdAndUpdate(doc._id, { status: 'expired' });
      timerState = { startedAt: doc.startedAt, durationMs: doc.durationMs, status: 'expired' };
      console.log('[TimerService] Timer found but expired during downtime. Marked as expired.');
    } else {
      // Restore the running timer to RAM
      timerState = {
        startedAt: doc.startedAt,
        durationMs: doc.durationMs,
        status: 'running'
      };
      const hRemaining = Math.floor(remainingMs / 3600000);
      const mRemaining = Math.floor((remainingMs % 3600000) / 60000);
      console.log(`[TimerService] Timer rehydrated from DB. ${hRemaining}h ${mRemaining}m remaining.`);
    }
  } catch (err) {
    console.error('[TimerService] Failed to rehydrate timer:', err.message);
  }
}
