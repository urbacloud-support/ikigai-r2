import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../backend/src/models/Team.js';
import Track from '../backend/src/models/Track.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function resetDummyTeams() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Delete all existing teams that start with "DUMMY" or have "DUMMY" in the name
    const result = await Team.deleteMany({ teamName: { $regex: /DUMMY/i } });
    console.log(`Deleted ${result.deletedCount} old dummy teams.`);

    // Get all tracks
    const tracks = await Track.find({});
    console.log(`Found ${tracks.length} tracks.`);

    // Create 1 dummy team per track
    let createdCount = 0;
    for (const track of tracks) {
      const newTeam = new Team({
        teamName: `DUMMY Team - ${track.code}`,
        assignedTrack: track.code,
        assignedProblemStatement: `PS_${track.code}_001`,
        leaderEmail: `leader_${track.code.toLowerCase()}@dummy.com`,
        status: 'approved',
        members: [
          { name: 'Alice Member', email: 'alice@dummy.com' },
          { name: 'Bob Member', email: 'bob@dummy.com' }
        ],
        assessments: []
      });
      await newTeam.save();
      createdCount++;
    }

    console.log(`Successfully created ${createdCount} new dummy teams (1 per track).`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

resetDummyTeams();
