import mongoose from 'mongoose';

const evaluatorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will be hashed
    mobile: { type: String },
    designation: { type: String },
    company: { type: String },
    
    // Which event they are evaluating at
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    
    // Instead of being locked to a single room/track, they can be assigned tracks 
    // but the actual assessments decouple them from strictly grading only that track
    assignedTracks: [{ type: String }],
    
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Evaluator', evaluatorSchema);
