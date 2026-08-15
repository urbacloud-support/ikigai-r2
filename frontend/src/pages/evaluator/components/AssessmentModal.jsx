import React, { useState, useEffect } from 'react';
import { X, CheckCircle, UserX, Loader2 } from 'lucide-react';

export default function AssessmentModal({ isOpen, onClose, team, eventCriteria, currentUserId, isLocked, onSubmit, onMarkAbsent }) {
  const [criteria, setCriteria] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [mode, setMode] = useState('criteria'); // 'criteria' or 'absent'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && team) {
      const existing = team.assessments?.find(a => a.evaluatorId === currentUserId);
      if (existing) {
        setMode(existing.mode || 'criteria');
        setFeedback(existing.feedback || '');
        if (existing.criteria && existing.criteria.length > 0) {
          setCriteria(existing.criteria);
        } else {
          initCriteria();
        }
      } else {
        setMode('criteria');
        setFeedback('');
        initCriteria();
      }
    }
  }, [isOpen, team, eventCriteria, currentUserId]);

  const initCriteria = () => {
    const initial = eventCriteria.map(c => ({
      name: c.name,
      maxMarks: c.maxMarks,
      inputType: c.inputType,
      score: c.inputType === 'boolean' ? false : (c.inputType === 'text' ? '' : 0)
    }));
    setCriteria(initial);
  };

  if (!isOpen || !team) return null;

  const handleScoreChange = (index, value) => {
    const newCriteria = [...criteria];
    newCriteria[index].score = value;
    setCriteria(newCriteria);
  };

  const calculateTotal = () => {
    return criteria.reduce((sum, c) => {
      if (c.inputType === 'number') return sum + (Number(c.score) || 0);
      if (c.inputType === 'boolean') return sum + (c.score ? c.maxMarks : 0);
      return sum;
    }, 0);
  };

  const maxTotal = criteria.reduce((sum, c) => sum + (c.inputType !== 'text' ? c.maxMarks : 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    setLoading(true);
    await onSubmit({ criteria, totalScore: calculateTotal(), mode, feedback });
    setLoading(false);
  };

  const handleAbsent = async () => {
    if (isLocked) return;
    if (!window.confirm(`Are you sure you want to mark ${team.teamName} as absent? Score will be 0.`)) return;
    setLoading(true);
    await onMarkAbsent();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Evaluate: {team.teamName || 'Unnamed'}</h3>
            <p className="text-sm text-gray-500 mt-1">Problem Statement: {team.assignedProblemStatement || 'N/A'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          
          {mode === 'absent' && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6 flex items-center gap-3">
              <UserX className="text-red-500" />
              <div>
                <h4 className="font-semibold text-sm">Team Marked Absent</h4>
                <p className="text-sm text-red-600">This team has been marked as absent. Total score is 0.</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <button 
              type="button"
              onClick={() => setMode('criteria')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'criteria' ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              Criteria Scoring
            </button>
            <button 
              type="button"
              onClick={handleAbsent}
              disabled={isLocked || loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'absent' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50'}`}
            >
              Mark Absent
            </button>
          </div>

          <form id="eval-form" onSubmit={handleSubmit} className={mode === 'absent' ? 'opacity-50 pointer-events-none' : ''}>
            <div className="space-y-5 mb-8">
              {criteria.map((c, index) => (
                <div key={index} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <label className="font-semibold text-gray-800">{c.name}</label>
                    <span className="text-sm text-gray-500 font-medium">Max: {c.maxMarks}</span>
                  </div>
                  
                  {c.inputType === 'number' && (
                    <div className="flex items-center gap-4">
                      <input
                        type="range" min="0" max={c.maxMarks}
                        value={c.score || 0}
                        onChange={(e) => handleScoreChange(index, Number(e.target.value))}
                        className="flex-1 accent-primary-500"
                        disabled={isLocked}
                      />
                      <span className="w-12 text-center font-bold text-lg text-primary-700">{c.score || 0}</span>
                    </div>
                  )}

                  {c.inputType === 'boolean' && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={!!c.score}
                        onChange={(e) => handleScoreChange(index, e.target.checked)}
                        className="w-5 h-5 text-primary-600 rounded"
                        disabled={isLocked}
                      />
                      <span className="text-gray-700">Yes ({c.maxMarks} marks)</span>
                    </label>
                  )}

                  {c.inputType === 'text' && (
                    <textarea 
                      value={c.score || ''}
                      onChange={(e) => handleScoreChange(index, e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows="2" placeholder="Text input..."
                      disabled={isLocked}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mb-4">
              <label className="block font-semibold text-gray-800 mb-2">Overall Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                required={mode !== 'absent'}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
                rows="3" placeholder="Constructive feedback for the team..."
                disabled={isLocked}
              />
            </div>
          </form>
        </div>

        <div className="p-4 bg-white flex justify-between items-center border-t border-gray-100">
          <div className="text-lg">
            <span className="text-gray-500 font-medium">Total Score: </span>
            <span className="font-bold text-gray-900">{mode === 'absent' ? 0 : calculateTotal()}</span>
            <span className="text-gray-400 text-sm"> / {maxTotal}</span>
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button 
              type="submit" form="eval-form"
              disabled={isLocked || loading || mode === 'absent'}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 disabled:bg-gray-400 disabled:shadow-none"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Save Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
