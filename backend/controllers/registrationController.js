import Team from '../models/Team.js';
import User from '../models/User.js';
import { io } from '../server.js';

export const submitRegistration = async (req, res) => {
  try {
    const { trackPreferences, transactionId } = req.body;
    
    if (!trackPreferences || !Array.isArray(trackPreferences) || !transactionId) {
      return res.status(400).json({ success: false, message: 'Invalid track preferences or transaction ID missing' });
    }

    if (!req.user.teamId) {
      return res.status(400).json({ success: false, message: 'User does not belong to a team' });
    }

    const team = await Team.findById(req.user.teamId);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.isRegistered) {
      return res.status(400).json({ success: false, message: 'Team is already registered' });
    }

    // Update team
    team.trackPreferences = trackPreferences;
    team.transactionId = transactionId;
    team.isRegistered = true;
    
    await team.save();

    // Since trust-based MVP, accounts for members are fully activated (they already exist in DB seeded or created via admin).
    // In a real scenario, this might trigger an email or change a status flag on the member Users.

    // Emit WebSocket event to notify connected clients (e.g., admin dashboard or team members)
    io.emit('team_registered', { teamId: team._id, teamName: team.teamName });

    res.status(200).json({ success: true, message: 'Registration complete', team });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
