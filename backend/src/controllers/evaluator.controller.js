import Team from '../models/Team.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

export const getSessionData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let event = null;
    if (user.assignedEventId) {
      event = await Event.findById(user.assignedEventId).select('_id title criteria selectedTracks');
    }
    
    res.json({ user, event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssignedTeams = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.isJudge && user.assignedEventId) {
      const event = await Event.findById(user.assignedEventId);
      if (event && event.selectedTeams && event.selectedTeams.length > 0) {
        const teams = await Team.find({ _id: { $in: event.selectedTeams } });
        return res.json(teams);
      }
    }

    if (!user.assignedTrackIds || user.assignedTrackIds.length === 0) {
      return res.json([]);
    }
    
    const teams = await Team.find({ assignedTrack: { $in: user.assignedTrackIds } });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitAssessment = async (req, res) => {
  const { criteria, totalScore, mode, progress } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (user.isLocked) {
      return res.status(403).json({ locked: true, message: 'Your assessment access is locked.' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (!user.assignedEventId) {
      return res.status(400).json({ message: 'Evaluator is not assigned to an event' });
    }
    const event = await Event.findById(user.assignedEventId);
    if (!event) return res.status(400).json({ message: 'Assigned event not found' });

    let eventObjIndex = team.assessments.findIndex(a => a.eventId.toString() === user.assignedEventId.toString());
    if (eventObjIndex === -1) {
      team.assessments.push({
        eventId: user.assignedEventId,
        eventName: event.title,
        evaluatorScores: []
      });
      eventObjIndex = team.assessments.length - 1;
    }

    const existingIndex = team.assessments[eventObjIndex].evaluatorScores.findIndex(
      a => a.evaluatorId.toString() === req.user._id.toString()
    );

    const assessmentData = {
      evaluatorId: req.user._id,
      evaluatorName: req.user.name,
      role: req.user.role,
      criteria: criteria || [],
      totalScore,
      mode: mode || 'criteria',
      progress
    };

    if (existingIndex !== -1) {
      team.assessments[eventObjIndex].evaluatorScores[existingIndex] = assessmentData;
    } else {
      team.assessments[eventObjIndex].evaluatorScores.push(assessmentData);
    }

    await team.save();

    const io = req.app.get('io');
    if (io && team.eventId) {
      io.to(`event:${team.eventId}`).emit('assessment-saved', { teamId: team._id, totalScore, mode: assessmentData.mode });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAbsent = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.isLocked) {
      return res.status(403).json({ locked: true, message: 'Your assessment access is locked.' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (!user.assignedEventId) {
      return res.status(400).json({ message: 'Evaluator is not assigned to an event' });
    }
    const event = await Event.findById(user.assignedEventId);
    if (!event) return res.status(400).json({ message: 'Assigned event not found' });

    let eventObjIndex = team.assessments.findIndex(a => a.eventId.toString() === user.assignedEventId.toString());
    if (eventObjIndex === -1) {
      team.assessments.push({
        eventId: user.assignedEventId,
        eventName: event.title,
        evaluatorScores: []
      });
      eventObjIndex = team.assessments.length - 1;
    }

    const existingIndex = team.assessments[eventObjIndex].evaluatorScores.findIndex(
      a => a.evaluatorId.toString() === req.user._id.toString()
    );

    const assessmentData = {
      evaluatorId: req.user._id,
      evaluatorName: req.user.name,
      role: req.user.role,
      criteria: [],
      totalScore: 0,
      mode: 'absent'
    };

    if (existingIndex !== -1) {
      team.assessments[eventObjIndex].evaluatorScores[existingIndex] = assessmentData;
    } else {
      team.assessments[eventObjIndex].evaluatorScores.push(assessmentData);
    }

    await team.save();

    const io = req.app.get('io');
    if (io && team.eventId) {
      io.to(`event:${team.eventId}`).emit('assessment-saved', { teamId: team._id, totalScore: 0, mode: 'absent' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
