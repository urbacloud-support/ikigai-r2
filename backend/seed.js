import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Team from './models/Team.js';
import Track from './models/Track.js';
import Event from './models/Event.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, '../temp');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/ikigai2';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // Clear existing data
    console.log('Clearing old data...');
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Track.deleteMany({}),
      Event.deleteMany({}),
    ]);

    // Create Admin
    console.log('Seeding Admin...');
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@csit.in',
      password: 'admin123',
      role: 'admin',
    });

    // Create Tracks
    console.log('Seeding Tracks...');
    const track1 = await Track.create({ title: 'AI & Machine Learning', description: 'Build intelligent systems.' });
    const track2 = await Track.create({ title: 'Web3 & Blockchain', description: 'Decentralized applications.' });
    const track3 = await Track.create({ title: 'App Development', description: 'Mobile and Web apps.' });

    // Create Dummy Teams
    console.log('Seeding Teams...');
    const teamsData = [];

    for (let i = 1; i <= 3; i++) {
      // Create Leader
      const leaderEmail = `leader${i}@test.com`;
      const leaderPassword = `leader${i}123`;
      const leader = await User.create({
        name: `Team ${i} Leader`,
        email: leaderEmail,
        password: leaderPassword,
        role: 'teamLeader',
      });

      // Create Members
      const members = [];
      for (let j = 1; j <= 3; j++) {
        const memberEmail = `team${i}_member${j}@test.com`;
        const memberPassword = `member${j}123`;
        const member = await User.create({
          name: `Team ${i} Member ${j}`,
          email: memberEmail,
          password: memberPassword,
          role: 'teamMember',
        });
        members.push(member);
        teamsData.push({
          Team: `Team ${i}`,
          Role: 'teamMember',
          Name: member.name,
          Email: memberEmail,
          Password: memberPassword,
        });
      }

      // Create Team
      const team = await Team.create({
        teamName: `Dummy Team ${i}`,
        leader: leader._id,
        members: members.map((m) => m._id),
      });

      // Link users to team
      await User.findByIdAndUpdate(leader._id, { team: team._id });
      for (const m of members) {
        await User.findByIdAndUpdate(m._id, { team: team._id });
      }

      teamsData.push({
        Team: `Team ${i}`,
        Role: 'teamLeader',
        Name: leader.name,
        Email: leaderEmail,
        Password: leaderPassword,
      });
    }

    // Export to Temp Directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Export JSON
    fs.writeFileSync(path.join(tempDir, 'teams.json'), JSON.stringify(teamsData, null, 2));

    // Export TXT
    const txtContent = teamsData.map(d => `[${d.Team}] ${d.Role}: ${d.Name} | ${d.Email} | ${d.Password}`).join('\n');
    fs.writeFileSync(path.join(tempDir, 'teams.txt'), txtContent);

    // Export CSV
    const csvHeader = 'Team,Role,Name,Email,Password\n';
    const csvContent = teamsData.map(d => `${d.Team},${d.Role},${d.Name},${d.Email},${d.Password}`).join('\n');
    fs.writeFileSync(path.join(tempDir, 'teams.csv'), csvHeader + csvContent);

    console.log(`Seeding complete. Credentials saved to temp/ directory.`);

    // Log admin creds
    console.log(`Admin Account: admin@csit.in / admin123`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
