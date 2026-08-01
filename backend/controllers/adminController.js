import Track from '../models/Track.js';
import Team from '../models/Team.js';
import User from '../models/User.js';

export const createTrack = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description required' });
    }

    const track = await Track.create({ title, description });
    res.status(201).json({ success: true, track });
  } catch (error) {
    console.error('Create Track Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTracks = async (req, res) => {
  try {
    const tracks = await Track.find({});
    res.status(200).json({ success: true, tracks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createTeam = async (req, res) => {
  try {
    const { teamName, leaderEmail, leaderName, leaderPassword } = req.body;
    if (!teamName || !leaderEmail || !leaderName || !leaderPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if leader email already exists
    const existingUser = await User.findOne({ email: leaderEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Leader email already in use' });
    }

    // Create Leader
    const leader = await User.create({
      name: leaderName,
      email: leaderEmail,
      password: leaderPassword,
      role: 'teamLeader',
    });

    // Create Team
    const team = await Team.create({
      teamName,
      leader: leader._id,
      members: [], // Members will be added later or seeded
    });

    // Link Leader to Team
    leader.team = team._id;
    await leader.save();

    res.status(201).json({ success: true, team, leader });
  } catch (error) {
    console.error('Create Team Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
