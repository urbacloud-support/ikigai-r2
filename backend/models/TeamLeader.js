import mongoose from 'mongoose';

const teamLeaderSchema = new mongoose.Schema({
    // Account Info
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will be hashed
    mobile: { type: String },
    
    // Team Info
    teamName: { type: String, required: true },
    members: [{
        name: String,
        email: String,
        mobile: String,
        isLeader: { type: Boolean, default: false }
    }],
    
    // Round 2 specific
    track: { type: String }, // e.g. "Software", "Hardware"
    problemStatement: { type: String },
    
    // Payment & Status
    paymentStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
    paymentReceipt: { type: String }, // Cloudinary URL
    
    // The new Assessments Architecture
    assessments: {
        evaluator: [{
            evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evaluator' },
            status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
            totalScore: { type: Number, default: 0 },
            criteriaScores: { type: Map, of: Number },
            feedback: { type: String },
            evaluatedAt: { type: Date }
        }],
        judge: [{
            judgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Judge' },
            status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
            totalScore: { type: Number, default: 0 },
            feedback: { type: String },
            evaluatedAt: { type: Date }
        }]
    }
}, { timestamps: true });

export default mongoose.model('TeamLeader', teamLeaderSchema);
