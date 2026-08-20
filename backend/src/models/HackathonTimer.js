import mongoose from 'mongoose';

const hackathonTimerSchema = new mongoose.Schema({
  startedAt: { type: Date, required: true },
  durationMs: { type: Number, required: true, default: 129600000 }, // 36 hours
  status: {
    type: String,
    enum: ['running', 'stopped', 'expired'],
    required: true,
    default: 'running'
  },
  startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stoppedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('HackathonTimer', hackathonTimerSchema, 'hackathontimers');
