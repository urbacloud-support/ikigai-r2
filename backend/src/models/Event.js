import mongoose from 'mongoose';

const embeddedTrackSchema = new mongoose.Schema({
  trackId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  description: { type: String },
  isLocked: { type: Boolean, default: false }
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String },
  isRegistrationOpen: { type: Boolean, default: false },
  selectedTracks: [embeddedTrackSchema],
  assessmentCriteria: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Event', eventSchema, 'events');
