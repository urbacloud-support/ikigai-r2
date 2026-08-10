import Event from '../models/Event.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Track from '../models/Track.js';

// @desc    Get all events
// @route   GET /api/admin/events
// @access  Private/Admin
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({});
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an event
// @route   POST /api/admin/events
// @access  Private/Admin
export const createEvent = async (req, res) => {
  const { title, description, date, location, trackIds } = req.body;
  try {
    // If no tracks specified, select all global tracks by default
    let query = {};
    if (trackIds && trackIds.length > 0) {
      query = { _id: { $in: trackIds } };
    }
    const globalTracks = await Track.find(query);
    
    const selectedTracks = globalTracks.map(t => ({
      trackId: t._id,
      title: t.title,
      description: t.description
    }));

    const event = new Event({
      title,
      description,
      date,
      location,
      selectedTracks
    });

    const createdEvent = await event.save();
    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (for Admin Users Tab)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tracks globally
// @route   GET /api/admin/tracks
// @access  Private/Admin
export const getGlobalTracks = async (req, res) => {
  try {
    const tracks = await Track.find({});
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
