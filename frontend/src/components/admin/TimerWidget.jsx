import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Square, RotateCcw, ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { authFetch } from '../../config/api.js';

// Formats milliseconds into HH:MM:SS string
function formatMs(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Timer state from server
  const [status, setStatus] = useState('stopped'); // 'running' | 'stopped' | 'expired'
  const [remainingMs, setRemainingMs] = useState(0);
  const [startedAt, setStartedAt] = useState(null);

  // Refs for the local tick interval and sync interval
  const tickRef = useRef(null);
  const syncRef = useRef(null);
  // Ref to track the "last sync time" so local tick stays accurate
  const lastSyncRef = useRef({ remainingMs: 0, syncedAt: null });

  // Fetch current timer status from server (JWT-authed admin endpoint)
  const fetchStatus = useCallback(async () => {
    try {
      const res = await authFetch('/admin/timer/status');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success) return;

      const t = data.timer;
      setStatus(t.status);
      setStartedAt(t.startedAt ? new Date(t.startedAt) : null);

      // Anchor the local countdown to the server value
      lastSyncRef.current = {
        remainingMs: t.remainingMs,
        syncedAt: Date.now()
      };
      setRemainingMs(t.remainingMs);
    } catch (_) {}
  }, []);

  // Start the local 1-second tick
  const startLocalTick = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setRemainingMs(() => {
        const { remainingMs: syncedMs, syncedAt } = lastSyncRef.current;
        if (!syncedAt) return 0;
        const elapsed = Date.now() - syncedAt;
        const computed = syncedMs - elapsed;
        return Math.max(0, computed);
      });
    }, 1000);
  }, []);

  // On mount: fetch initial state, start tick, start 30s sync
  useEffect(() => {
    fetchStatus();
    startLocalTick();

    // Re-sync with server every 30 seconds
    syncRef.current = setInterval(fetchStatus, 30000);

    return () => {
      clearInterval(tickRef.current);
      clearInterval(syncRef.current);
    };
  }, [fetchStatus, startLocalTick]);

  // When status changes to 'running', ensure tick is running
  useEffect(() => {
    if (status === 'running') {
      startLocalTick();
    } else {
      clearInterval(tickRef.current);
    }
  }, [status, startLocalTick]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/admin/timer/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { alert(data.message || 'Failed to start timer'); return; }
      await fetchStatus();
    } catch (e) { alert('Network error'); }
    finally { setLoading(false); }
  };

  const handleStop = async () => {
    if (!window.confirm('Stop the hackathon timer? The countdown will freeze at its current value.')) return;
    setLoading(true);
    try {
      const res = await authFetch('/admin/timer/stop', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { alert(data.message || 'Failed to stop timer'); return; }
      setStatus('stopped');
      clearInterval(tickRef.current);
    } catch (e) { alert('Network error'); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset the hackathon timer? This permanently clears the current session.')) return;
    setLoading(true);
    try {
      const res = await authFetch('/admin/timer/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { alert(data.message || 'Failed to reset timer'); return; }
      setStatus('stopped');
      setRemainingMs(0);
      setStartedAt(null);
      lastSyncRef.current = { remainingMs: 0, syncedAt: null };
      clearInterval(tickRef.current);
    } catch (e) { alert('Network error'); }
    finally { setLoading(false); }
  };

  // Pill display text and color
  const pillLabel = status === 'running'
    ? formatMs(remainingMs)
    : status === 'expired'
      ? "Time's Up!"
      : 'Timer: Inactive';

  const pillColor = status === 'running'
    ? 'bg-emerald-600 text-white'
    : status === 'expired'
      ? 'bg-red-600 text-white'
      : 'bg-gray-600 text-white';

  const TOTAL_MS = 36 * 60 * 60 * 1000;
  const progressPct = status === 'running'
    ? Math.min(100, ((TOTAL_MS - remainingMs) / TOTAL_MS) * 100)
    : 0;

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-64 shadow-2xl rounded-2xl overflow-hidden border border-gray-200">

      {/* Expanded Control Card — slides up above the pill */}
      {isOpen && (
        <div className="bg-white border-b border-gray-100 p-4 space-y-4">

          {/* Big countdown display */}
          <div className="text-center">
            <div className={`text-3xl font-black font-mono tracking-wider ${
              status === 'running' ? 'text-emerald-600' :
              status === 'expired' ? 'text-red-500' : 'text-gray-400'
            }`}>
              {status === 'running' ? formatMs(remainingMs) :
               status === 'expired' ? "TIME'S UP" : '--:--:--'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {status === 'running' ? 'remaining of 36:00:00' :
               status === 'expired' ? 'Hackathon complete' : 'Not started'}
            </div>
          </div>

          {/* Progress bar */}
          {status === 'running' && (
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          {/* Started-at timestamp */}
          {startedAt && (
            <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
              <Clock size={11} />
              Started: {new Date(startedAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {status !== 'running' && (
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition disabled:opacity-50 text-sm"
              >
                <Play size={15} />
                {loading ? 'Starting...' : 'Start Hackathon'}
              </button>
            )}

            {status === 'running' && (
              <button
                onClick={handleStop}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition disabled:opacity-50 text-sm"
              >
                <Square size={15} />
                {loading ? 'Stopping...' : 'Stop Timer'}
              </button>
            )}

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition disabled:opacity-50 text-sm"
            >
              <RotateCcw size={14} />
              {loading ? 'Resetting...' : 'Reset Timer'}
            </button>
          </div>
        </div>
      )}

      {/* Pill — always visible, shows live countdown */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 font-bold text-sm transition-colors ${pillColor}`}
      >
        <div className="flex items-center gap-2">
          <Timer size={16} />
          <span className="font-mono tracking-wide">{pillLabel}</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
    </div>
  );
}
