import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g. "AI/ML", "Web Dev"
    description: { type: String },
    capacity: { type: Number },
    currentCount: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false }
});

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    date: { type: Date },
    venue: { type: String },
    description: { type: String },
    
    // Embedded tracks strictly scoped to this event
    tracks: [trackSchema],
    
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
