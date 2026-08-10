import Team from '../models/Team.js';
import Event from '../models/Event.js';

// @desc    Get teams assigned to evaluator's track/event
// @route   GET /api/evaluator/teams
// @access  Private/Evaluator
export const getAssignedTeams = async (req, res) => {
  try {
    // In a full implementation, you'd filter by the evaluator's assigned event/track.
    // For now, we fetch teams to allow them to assess.
    const teams = await Team.find({}).populate('eventId');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit an assessment for a team
// @route   PATCH /api/evaluator/teams/:id/assess
// @access  Private/Evaluator
export const submitAssessment = async (req, res) => {
  const { criteriaScores, totalScore, feedback } = req.body;
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if evaluator already assessed this team
    const existingIndex = team.assessments.findIndex(
      a => a.evaluatorId.toString() === req.user._id.toString()
    );

    const assessmentData = {
      evaluatorId: req.user._id,
      evaluatorName: req.user.name,
      role: req.user.role,
      criteriaScores,
      totalScore,
      feedback
    };

    if (existingIndex !== -1) {
      team.assessments[existingIndex] = assessmentData;
    } else {
      team.assessments.push(assessmentData);
    }

    await team.save();

    // In the future, this is where Socket.io will emit the "assessment-saved" event
    const io = req.app.get('io');
    if (io) {
      io.emit('assessment-saved', { teamId: team._id, totalScore });
    }

    res.json({ success: true, message: 'Assessment saved', team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
