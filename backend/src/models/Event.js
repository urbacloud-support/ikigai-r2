import mongoose from 'mongoose';

const embeddedTrackSchema = new mongoose.Schema({
  trackId: { type: mongoose.Schema.Types.ObjectId, required: true },
  code: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String }
});

const criteriaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  maxMarks: { type: Number, default: 10 },
  inputType: { type: String, default: 'number', enum: ['number', 'text', 'boolean'] },
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String },
  selectedTracks: [embeddedTrackSchema],
  selectedTeams: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team',
    default: []
  }],
  criteria: { type: [criteriaSchema], default: [] },
  linkedPastEvents: { type: [String], default: [] }
}, { timestamps: true });
eventSchema.index({ selectedTeams: 1 });

export default mongoose.model('Event', eventSchema, 'events');
