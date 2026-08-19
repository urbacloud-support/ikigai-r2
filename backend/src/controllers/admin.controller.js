import Event from '../models/Event.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Track from '../models/Track.js';
import { hashPassword } from '../utils/hash.js';

// --- Events ---

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({});
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createEvent = async (req, res) => {
  const { title, description, date, location, trackIds, linkedPastEvents, selectedTeams } = req.body;
  try {
    let query = {};
    if (trackIds && trackIds.length > 0) {
      query = { _id: { $in: trackIds } };
    }
    const globalTracks = await Track.find(query);
    
    const selectedTracks = globalTracks.map(t => ({
      trackId: t._id,
      code: t.code,
      title: t.title,
      description: t.description
    }));

    const event = new Event({ 
      title, 
      description, 
      date, 
      location, 
      selectedTracks, 
      linkedPastEvents: linkedPastEvents || [],
      selectedTeams: selectedTeams || [] 
    });
    const createdEvent = await event.save();
    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  const { title, description, date, linkedPastEvents, selectedTeams } = req.body;
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (date) event.date = date;
    if (linkedPastEvents !== undefined) event.linkedPastEvents = linkedPastEvents;
    if (selectedTeams !== undefined) event.selectedTeams = selectedTeams;
    
    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    // Unset assignedEventId for any evaluators
    await User.updateMany({ assignedEventId: event._id }, { $set: { assignedEventId: null, assignedTrackIds: [] } });
    
    res.json({ message: 'Event removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEventCriteria = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    event.criteria = req.body.criteria || [];
    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventEvaluators = async (req, res) => {
  try {
    const evaluators = await User.find({ 
      assignedEventId: req.params.id, 
      role: { $in: ['evaluator', 'judge'] } 
    }).select('-password');
    res.json(evaluators);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const lockAllEvaluators = async (req, res) => {
  const { locked } = req.body;
  try {
    const evaluators = await User.find({ 
      assignedEventId: req.params.id, 
      role: { $in: ['evaluator', 'judge'] } 
    });
    
    const io = req.app.get('io');
    for (const evalUser of evaluators) {
      evalUser.isLocked = locked;
      await evalUser.save();
      if (io) {
        io.to(`evaluator:${evalUser._id}`).emit('evaluator-lock-changed', { isLocked: locked });
      }
    }
    
    res.json({ message: `All evaluators ${locked ? 'locked' : 'unlocked'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Users ---

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  const { name, email, role, isJudge } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Extract first name for password (e.g. John -> john123)
    const nameParts = name.trim().split(/\s+/);
    let firstName = nameParts[0].toLowerCase();
    
    // Ignore common titles
    const titles = ['mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'mr', 'mrs', 'ms', 'dr', 'prof'];
    if (titles.includes(firstName) && nameParts.length > 1) {
      firstName = nameParts[1].toLowerCase();
    }
    // Remove non-alphanumeric characters
    firstName = firstName.replace(/[^a-z0-9]/g, '') || 'evaluator';

    const generatedPassword = `${firstName}123`;

    const user = await User.create({
      name,
      email,
      role,
      isJudge: isJudge || false,
      password: hashPassword(generatedPassword)
    });

    const userObj = user.toObject();
    delete userObj.password;
    
    res.status(201).json({ user: userObj, generatedPassword });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { name, email, role, isJudge } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isJudge !== undefined) user.isJudge = isJudge;
    
    const updatedUser = await user.save();
    const userObj = updatedUser.toObject();
    delete userObj.password;
    
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignEvaluator = async (req, res) => {
  const { trackCode, eventId } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (trackCode && !user.assignedTrackIds.includes(trackCode)) {
      user.assignedTrackIds.push(trackCode);
    }
    user.assignedEventId = eventId;
    await user.save();
    
    res.json({ message: 'Evaluator assigned' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleEvaluatorLock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isLocked = !user.isLocked;
    await user.save();
    
    const io = req.app.get('io');
    if (io) {
      io.to(`evaluator:${user._id}`).emit('evaluator-lock-changed', { isLocked: user.isLocked });
    }
    
    res.json({ message: 'Lock toggled', isLocked: user.isLocked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Teams ---

export const getTeams = async (req, res) => {
  const { trackCode } = req.query;
  try {
    const query = trackCode ? { assignedTrack: trackCode } : {};
    const teams = await Team.find(query);
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Tracks ---

export const getGlobalTracks = async (req, res) => {
  try {
    const tracks = await Track.find({});
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
