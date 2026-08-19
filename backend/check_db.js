import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from './src/models/Team.js';
import Event from './src/models/Event.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const team = await Team.findOne({ teamName: 'DUMMY Team 001' });
  if (!team) {
    console.log('Team not found');
  } else {
    console.log('Team Assessments:', JSON.stringify(team.assessments, null, 2));
  }

  const events = await Event.find({}, 'title linkedPastEvents');
  console.log('Events:', JSON.stringify(events, null, 2));

  await mongoose.disconnect();
};

run().catch(console.error);
