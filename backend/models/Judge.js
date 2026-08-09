import mongoose from 'mongoose';

const judgeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String },
    
    // Explicitly stubbed out for future feature differentiation
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Judge', judgeSchema);
