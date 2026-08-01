import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['mentoring', 'food', 'submission', 'general'],
      required: true,
    },
    description: {
      type: String,
    },
    scheduledTime: {
      type: Date,
    },
    visibility: [
      {
        type: String,
        enum: ['admin', 'teamLeader', 'teamMember', 'mentor', 'judge'],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Event', EventSchema);
