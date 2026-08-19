import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  evaluatorName: { type: String },
  role: { type: String, enum: ['evaluator', 'judge'], required: true },
  criteria: { type: [mongoose.Schema.Types.Mixed], default: [] },
  totalScore: { type: Number, default: 0 },
  mode: { type: String, enum: ['criteria', 'absent'], default: 'criteria' },
  progress: { type: String }
}, { timestamps: true });

const eventAssessmentSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  eventName: { type: String, required: true },
  evaluatorScores: [assessmentSchema]
}, { _id: false });

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
  teamName: { type: String, default: '' },
  assignedTrack: { type: String, default: '' },
  assignedProblemStatement: { type: String, default: '' },
  trackPreferences: { type: [String], default: [] },
  leaderEmail: { type: String, required: true },
  members: [memberSchema],
  project: {
    title: String,
    description: String,
    domain: String,
    problemStatement: String
  },
  status: { type: String, default: 'Pending' },
  assessments: [eventAssessmentSchema]
}, { timestamps: true });

export default mongoose.model('Team', teamSchema, 'teams');
