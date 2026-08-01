import Track from '../models/Track.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import bcrypt from 'bcryptjs';

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

export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find({}).populate('leader', 'name email').populate('members', 'name email').populate('trackPreferences', 'title');
    res.status(200).json({ success: true, teams });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createTeam = async (req, res) => {
  try {
    const { teamName, leaderName, leaderEmail, leaderPassword } = req.body;
    
    if (!teamName || !leaderEmail || !leaderName || !leaderPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(leaderPassword, 10);
    
    // Create leader user first
    const leader = new User({
      name: leaderName,
      email: leaderEmail,
      password: hashedPassword,
      role: 'teamLeader'
    });
    
    await leader.save();
    
    // Create team
    const team = new Team({
      teamName,
      leader: leader._id,
      members: [leader._id]
    });
    
    await team.save();
    
    // Update leader with teamId
    leader.team = team._id;
    await leader.save();
    
    res.status(201).json({ success: true, team, leader });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email or Team name already exists' });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { title, description, date, type } = req.body;
    const event = new Event({ 
      title, 
      description, 
      scheduledTime: date,
      type: type || 'general',
      visibility: ['teamLeader', 'teamMember']
    });
    await event.save();
    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({});
    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
