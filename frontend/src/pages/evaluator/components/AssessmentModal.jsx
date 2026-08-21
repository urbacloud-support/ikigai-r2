import React, { useState, useEffect } from 'react';
import { X, CheckCircle, UserX, Loader2, MousePointerClick, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, User, Users, FileText, Mail, Building, MapPin, AlertCircle } from 'lucide-react';
import { getProblemStatementName, getTrackName } from '../../../utils/mappingUtils';

export default function AssessmentModal({ isOpen, onClose, team, currentIndex, totalTeams, onNext, onPrev, eventCriteria, currentUserId, currentEventId, linkedPastEvents = [], isLocked, onSubmit, onMarkAbsent, isJudge }) {
  const [criteria, setCriteria] = useState([]);
  const [touchedBooleans, setTouchedBooleans] = useState({}); // tracks which boolean criteria were explicitly interacted with
  const [progress, setProgress] = useState('');
  const [mode, setMode] = useState('criteria'); // 'criteria' or 'absent'
  const [loading, setLoading] = useState(false);
  const [openSection, setOpenSection] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setOpenSection('');
    setValidationError('');
    setTouchedBooleans({});
  }, [team, isOpen]);

  useEffect(() => {
    if (isOpen && team) {
      const eventObj = team.assessments?.find(a => a.eventId === currentEventId);
      const existing = eventObj?.evaluatorScores?.find(a => a.evaluatorId === currentUserId);
      if (existing) {
        setMode(existing.mode || 'criteria');
        setProgress(existing.progress || '');
        if (existing.criteria && existing.criteria.length > 0) {
          setCriteria(existing.criteria);
          // Pre-mark booleans from DB as touched — evaluator already saved them previously
          const preTouched = {};
          existing.criteria.forEach((c, idx) => {
            if (c.inputType === 'boolean') preTouched[idx] = true;
          });
          setTouchedBooleans(preTouched);
        } else {
          initCriteria();
        }
      } else {
        setMode('criteria');
        setProgress('');
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
    setTouchedBooleans({});
  };

  if (!isOpen || !team) return null;

  const handleScoreChange = (index, value) => {
    const newCriteria = [...criteria];
    newCriteria[index].score = value;
    setCriteria(newCriteria);
    setValidationError('');
  };

  const handleBooleanChange = (index, checked) => {
    handleScoreChange(index, checked);
    setTouchedBooleans(prev => ({ ...prev, [index]: true }));
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

    if (mode === 'criteria') {
      // Validate text-type criteria are non-empty
      const emptyTextCriterion = criteria.find(c =>
        c.inputType === 'text' && (!c.score || String(c.score).trim() === '')
      );
      if (emptyTextCriterion) {
        setValidationError(`"${emptyTextCriterion.name}" cannot be left blank. Please enter a value before saving.`);
        setOpenSection('evaluation');
        return;
      }

      // Validate boolean-type criteria were explicitly interacted with
      const untouchedBoolean = criteria.find((c, idx) =>
        c.inputType === 'boolean' && !touchedBooleans[idx]
      );
      if (untouchedBoolean) {
        setValidationError(`Please explicitly check or uncheck "${untouchedBoolean.name}" before saving.`);
        setOpenSection('evaluation');
        return;
      }

      // Validate progress notes are non-empty
      if (!progress || progress.trim() === '') {
        setValidationError('Progress Notes cannot be empty. Please document the team\'s progress before saving.');
        setOpenSection('evaluation');
        return;
      }
    }

    setValidationError('');
    setLoading(true);
    const serverError = await onSubmit({ criteria, totalScore: calculateTotal(), mode, progress });
    setLoading(false);
    if (serverError) {
      setValidationError(serverError);
      setOpenSection('evaluation');
    } else {
      onClose();
    }
  };

  const handleAbsent = async () => {
    if (isLocked) return;
    if (!window.confirm(`Are you sure you want to mark ${team.teamName} as absent? Score will be 0.`)) return;
    setLoading(true);
    await onMarkAbsent();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Desktop Left Click Area */}
      {currentIndex !== undefined && currentIndex > 0 && (
        <button 
          onClick={onPrev}
          className="hidden md:flex absolute left-0 top-0 bottom-0 w-[calc(50%-22rem)] flex-col items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer z-40 group"
        >
          <span className="text-xl font-bold mb-3">&larr; Previous team</span>
          <MousePointerClick size={32} className="opacity-50 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {/* Desktop Right Click Area */}
      {currentIndex !== undefined && totalTeams !== undefined && currentIndex < totalTeams - 1 && (
        <button 
          onClick={onNext}
          className="hidden md:flex absolute right-0 top-0 bottom-0 w-[calc(50%-22rem)] flex-col items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer z-40 group"
        >
          <span className="text-xl font-bold mb-3">Next team &rarr;</span>
          <MousePointerClick size={32} className="opacity-50 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-50">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white sticky top-0 z-10 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Evaluate: {team.teamName || 'Unnamed'}</h3>
            <p className="text-sm text-gray-500 mt-1">Problem Statement: {getProblemStatementName(team.assignedProblemStatement, true)}</p>
          </div>
          <button onClick={onClose} className="btn btn-icon shrink-0 mt-1">
            <X size={20} />
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mx-6 mt-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 animate-in slide-in-from-top-2 duration-200">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-snug">{validationError}</p>
            <button onClick={() => setValidationError('')} className="ml-auto text-red-400 hover:text-red-600 shrink-0">
              <X size={16} />
            </button>
          </div>
        )}

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

          {/* Team Details Collapsible */}
          <div className="mb-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button 
              type="button"
              onClick={() => setOpenSection(openSection === 'details' ? '' : 'details')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Users size={18} className="text-primary-500" /> Team Details
              </h4>
              {openSection === 'details' ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
            </button>
            
            <div className={openSection === 'details' ? 'block' : 'hidden'}>
              <div className="p-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Team Name</p>
                    <p className="font-medium text-gray-900">{team.teamName || 'Unnamed'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Track</p>
                    <p className="font-medium text-gray-900">{getTrackName(team.assignedTrack)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Problem Statement</p>
                    <p className="font-medium text-gray-900">{getProblemStatementName(team.assignedProblemStatement, true)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500 mb-3 border-b border-gray-100 pb-2">Members ({team.members?.length || 0})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {team.members?.map((m, i) => {
                      const isLeader = m.email === team.leaderEmail;
                      return (
                        <div key={i} className={`p-3 rounded-lg border ${isLeader ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-100'} flex items-start gap-3`}>
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt={m.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || 'User')}&background=random&color=fff`} alt={m.name || 'User'} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <p className="font-bold text-gray-900 break-words">{m.name || 'Unnamed'}</p>
                              {isLeader && <span className="text-[10px] font-bold bg-primary-200 text-primary-800 px-1.5 py-0.5 rounded uppercase shrink-0">Leader</span>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-start gap-1.5 text-xs text-gray-600">
                                <Mail size={14} className="shrink-0 text-gray-400 mt-0.5" />
                                <span className="break-words leading-tight flex-1">{m.email}</span>
                              </div>
                              {m.organisation && (
                                <div className="flex items-start gap-1.5 text-xs text-gray-600">
                                  <Building size={14} className="shrink-0 text-gray-400 mt-0.5" />
                                  <span className="break-words leading-tight flex-1">{m.organisation}</span>
                                </div>
                              )}
                              {m.location && (
                                <div className="flex items-start gap-1.5 text-xs text-gray-600">
                                  <MapPin size={14} className="shrink-0 text-gray-400 mt-0.5" />
                                  <span className="break-words leading-tight flex-1">{m.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Past Session History Collapsible */}
          {linkedPastEvents.length > 0 && team.assessments && (
            <div className="mb-4 bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
              <button 
                type="button"
                onClick={() => setOpenSection(openSection === 'history' ? '' : 'history')}
                className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100/50 transition-colors"
              >
                <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <CheckCircle size={18} className="text-blue-500" /> Past Session History
                </h4>
                {openSection === 'history' ? <ChevronUp size={18} className="text-blue-500" /> : <ChevronDown size={18} className="text-blue-500" />}
              </button>
              
              <div className={openSection === 'history' ? 'block' : 'hidden'}>
                <div className="p-4 border-t border-blue-100 bg-blue-50/30">
                  <div className="flex flex-col gap-3">
                    {linkedPastEvents.map((eventName, idx) => {
                      const pastEventObj = team.assessments.find(a => a.eventName === eventName);
                      if (!pastEventObj || !pastEventObj.evaluatorScores || pastEventObj.evaluatorScores.length === 0) return null;
                      
                      return (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                          <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            {eventName}
                          </div>
                          <div className="flex flex-col gap-3">
                            {pastEventObj.evaluatorScores.map((score, sIdx) => (
                              <div key={sIdx} className="bg-gray-50/80 border border-gray-100 p-3 rounded-xl shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-sm font-semibold text-gray-800">{score.evaluatorName} ({score.role})</span>
                                  {(!isJudge || !score.criteria || score.criteria.length === 0) && (
                                    <span className="text-sm font-bold text-gray-900">{score.mode === 'absent' ? 'Absent' : `${score.totalScore} pts`}</span>
                                  )}
                                </div>
                                
                                {isJudge && score.criteria && score.criteria.length > 0 && (
                                  <div className="bg-white border border-gray-200/80 rounded-lg shadow-sm mb-3 divide-y divide-gray-100">
                                    {score.criteria.map((c, cIdx) => (
                                      <div key={cIdx} className="flex flex-col px-3 py-2">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5 leading-tight">{c.name}</span>
                                        <span className="font-bold text-gray-900 text-sm">{c.inputType === 'boolean' ? (c.score ? 'Yes' : 'No') : c.score}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {score.progress && (
                                  <p className="text-xs text-gray-600 italic bg-white p-3 rounded-lg border border-gray-100">"{score.progress}"</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Collapsible */}
          <div className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button 
              type="button"
              onClick={() => setOpenSection(openSection === 'evaluation' ? '' : 'evaluation')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle size={18} className="text-primary-500" /> Evaluation
              </h4>
              {openSection === 'evaluation' ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
            </button>
            
            <div className={openSection === 'evaluation' ? 'block' : 'hidden'}>
              <div className="p-4 border-t border-gray-100">
                <form id="eval-form" onSubmit={handleSubmit} className={mode === 'absent' ? 'opacity-50 pointer-events-none' : ''}>
                  <div className="space-y-5 mb-8">
              {criteria.map((c, index) => (
                <div key={index} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <label className="font-semibold text-gray-800">{c.name}</label>
                    {c.inputType !== 'text' && (
                      <span className="text-sm text-gray-500 font-medium">Max: {c.maxMarks}</span>
                    )}
                  </div>
                  
                  {c.inputType === 'number' && (
                    <div className="flex items-center gap-4">
                      <input
                        type="range" min="0" max={c.maxMarks}
                        value={c.score === '' ? 0 : (c.score || 0)}
                        onChange={(e) => handleScoreChange(index, Number(e.target.value))}
                        className="flex-1 accent-primary-500"
                        disabled={isLocked}
                      />
                      <input
                        type="number"
                        min="0"
                        max={c.maxMarks}
                        value={c.score === '' ? '' : (c.score !== undefined && c.score !== null ? c.score : 0)}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val === '') {
                            handleScoreChange(index, '');
                            return;
                          }
                          if (val.length > 2) val = val.slice(0, 2);
                          let numVal = Number(val);
                          if (numVal > c.maxMarks) numVal = c.maxMarks;
                          if (numVal < 0) numVal = 0;
                          handleScoreChange(index, numVal);
                        }}
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className="w-16 text-center font-bold text-lg text-primary-700 border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none py-1"
                        disabled={isLocked}
                      />
                    </div>
                  )}

                  {c.inputType === 'boolean' && (
                    <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${touchedBooleans[index] ? 'bg-primary-50 border-primary-200' : 'bg-amber-50 border-amber-200'}`}>
                      <input 
                        type="checkbox"
                        checked={!!c.score}
                        onChange={(e) => handleBooleanChange(index, e.target.checked)}
                        className="w-5 h-5 text-primary-600 rounded"
                        disabled={isLocked}
                      />
                      <div className="flex flex-col">
                        <span className="text-gray-700">Yes ({c.maxMarks} marks)</span>
                        {!touchedBooleans[index] && (
                          <span className="text-xs text-amber-600 font-medium">Please check or uncheck to confirm</span>
                        )}
                      </div>
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

            <div className={`bg-white p-5 rounded-xl border shadow-sm mb-4 ${!progress.trim() && mode !== 'absent' ? 'border-amber-200' : 'border-gray-100'}`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progress Notes
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                disabled={isLocked || mode === 'absent'}
                value={progress}
                onChange={e => { setProgress(e.target.value); setValidationError(''); }}
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-gray-50 resize-none text-sm transition-colors ${
                  !progress.trim() && mode !== 'absent' ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
                }`}
                rows="3" placeholder="Document the team's progress or task outcome... (required)"
              />
              {!progress.trim() && mode !== 'absent' && (
                <p className="text-xs text-amber-600 mt-1 font-medium">This field is required before saving.</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <div className="bg-primary-50 text-primary-900 border border-primary-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                {maxTotal > 0 ? (
                  <>
                    <span className="text-primary-700 font-bold text-sm uppercase tracking-wide">Total Score:</span>
                    <span className="font-bold text-2xl leading-none">{mode === 'absent' ? 0 : calculateTotal()}</span>
                    <span className="text-primary-600/70 text-sm whitespace-nowrap mt-1">/ {maxTotal}</span>
                  </>
                ) : (
                  <span className="text-primary-700 font-medium italic">Qualitative Assessment</span>
                )}
              </div>
              
              {currentIndex !== undefined && totalTeams !== undefined && (
                <div className="md:hidden flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 shrink-0">
                  <button 
                    onClick={onPrev} 
                    disabled={currentIndex === 0}
                    className="p-1.5 text-gray-600 hover:bg-white rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium text-gray-600 px-2 whitespace-nowrap">
                    {currentIndex + 1} of {totalTeams}
                  </span>
                  <button 
                    onClick={onNext} 
                    disabled={currentIndex === totalTeams - 1}
                    className="p-1.5 text-gray-600 hover:bg-white rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button type="button" onClick={onClose} className="btn btn-secondary flex-1 sm:flex-none">
                Cancel
              </button>
              <button 
                type="submit" form="eval-form"
                disabled={isLocked || loading || mode === 'absent'}
                className="btn btn-primary flex-1 sm:flex-none flex justify-center items-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Save Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
