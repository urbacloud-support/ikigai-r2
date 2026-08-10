import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  evaluatorName: { type: String },
  role: { type: String, enum: ['evaluator', 'judge'], required: true },
  criteriaScores: {
    type: Map,
    of: Number,
  },
  totalScore: { type: Number, required: true },
  feedback: { type: String }
}, { timestamps: true });

const memberSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  candidateRole: String,
  location: String,
  userType: String,
  domain: String,
  course: String,
  specialization: String,
  courseType: String,
  courseDuration: String,
  classGrade: String,
  gradYear: String,
  organisation: String,
  state: String,
  country: String,
  website: String,
  linkedIn: String,
  github: String,
  twitter: String,
  instagram: String,
  resume: String,
  referralCode: String
});

const teamSchema = new mongoose.Schema({
  participantId: { type: mongoose.Schema.Types.ObjectId },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  leaderEmail: { type: String, required: true },
  members: [memberSchema],
  project: {
    title: String,
    description: String,
    domain: String,
    problemStatement: String
  },
  status: { type: String, default: 'Pending' },
  assessments: [assessmentSchema]
}, { timestamps: true });

export default mongoose.model('Team', teamSchema, 'teams');
