import Team from '../models/Team.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

export const getSessionData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let event = null;
    if (user.assignedEventId) {
      event = await Event.findById(user.assignedEventId).select('_id title criteria selectedTracks linkedPastEvents');
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

    const teamId = req.params.id;
    const team = await Team.findById(teamId); // just to check existence
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (!user.assignedEventId) {
      return res.status(400).json({ message: 'Evaluator is not assigned to an event' });
    }
    const event = await Event.findById(user.assignedEventId);
    if (!event) return res.status(400).json({ message: 'Assigned event not found' });

    const eventId = user.assignedEventId;
    
    // Atomically ensure event object exists
    await Team.updateOne(
      { _id: teamId, "assessments.eventId": { $ne: eventId } },
      { $push: { assessments: { eventId, eventName: event.title, evaluatorScores: [] } } }
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

    const setObj = {};
    for (const [k, v] of Object.entries(assessmentData)) {
       setObj[`assessments.$[eventElem].evaluatorScores.$[evalElem].${k}`] = v;
    }

    // Atomically try to update if evaluator score already exists
    const updateResult = await Team.updateOne(
      { 
        _id: teamId, 
        "assessments.eventId": eventId,
        "assessments.evaluatorScores.evaluatorId": req.user._id
      },
      {
        $set: setObj
      },
      {
        arrayFilters: [
          { "eventElem.eventId": eventId },
          { "evalElem.evaluatorId": req.user._id }
        ]
      }
    );

    // If it didn't exist, push it atomically
    if (updateResult.matchedCount === 0) {
      await Team.updateOne(
        { _id: teamId, "assessments.eventId": eventId },
        { $push: { "assessments.$.evaluatorScores": assessmentData } }
      );
    }

    const updatedTeam = await Team.findById(teamId);

    const io = req.app.get('io');
    if (io && updatedTeam.eventId) {
      io.to(`event:${updatedTeam.eventId}`).emit('assessment-saved', { teamId: updatedTeam._id, totalScore, mode: assessmentData.mode });
    }

    res.json(updatedTeam);
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

    const teamId = req.params.id;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (!user.assignedEventId) {
      return res.status(400).json({ message: 'Evaluator is not assigned to an event' });
    }
    const event = await Event.findById(user.assignedEventId);
    if (!event) return res.status(400).json({ message: 'Assigned event not found' });

    const eventId = user.assignedEventId;

    await Team.updateOne(
      { _id: teamId, "assessments.eventId": { $ne: eventId } },
      { $push: { assessments: { eventId, eventName: event.title, evaluatorScores: [] } } }
    );

    const assessmentData = {
      evaluatorId: req.user._id,
      evaluatorName: req.user.name,
      role: req.user.role,
      criteria: [],
      totalScore: 0,
      mode: 'absent'
    };

    const setObj = {};
    for (const [k, v] of Object.entries(assessmentData)) {
       setObj[`assessments.$[eventElem].evaluatorScores.$[evalElem].${k}`] = v;
    }

    const updateResult = await Team.updateOne(
      { 
        _id: teamId, 
        "assessments.eventId": eventId,
        "assessments.evaluatorScores.evaluatorId": req.user._id
      },
      {
        $set: setObj
      },
      {
        arrayFilters: [
          { "eventElem.eventId": eventId },
          { "evalElem.evaluatorId": req.user._id }
        ]
      }
    );

    if (updateResult.matchedCount === 0) {
      await Team.updateOne(
        { _id: teamId, "assessments.eventId": eventId },
        { $push: { "assessments.$.evaluatorScores": assessmentData } }
      );
    }

    const updatedTeam = await Team.findById(teamId);

    const io = req.app.get('io');
    if (io && updatedTeam.eventId) {
      io.to(`event:${updatedTeam.eventId}`).emit('assessment-saved', { teamId: updatedTeam._id, totalScore: 0, mode: 'absent' });
    }

    res.json(updatedTeam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
