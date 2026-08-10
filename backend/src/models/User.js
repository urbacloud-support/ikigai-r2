import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'teamLeader', 'evaluator', 'judge', 'studentCoordinator'], 
    required: true 
  },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

export default mongoose.model('User', userSchema, 'users');
