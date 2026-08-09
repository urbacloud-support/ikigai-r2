import mongoose from 'mongoose';

const studentCoordinatorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String },
    
    // Event/Track assignment
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    assignedTrack: { type: String },
    
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('StudentCoordinator', studentCoordinatorSchema);
