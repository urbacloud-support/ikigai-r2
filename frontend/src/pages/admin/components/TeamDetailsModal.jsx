import React from 'react';
import { X, User, Star, FileText, CheckCircle, UserX, MessageSquare } from 'lucide-react';
import { getTrackName, getProblemStatementName } from '../../../utils/mappingUtils';

export default function TeamDetailsModal({ isOpen, onClose, team }) {
  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 md:pb-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-7xl flex flex-col max-h-[85vh] lg:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{team.teamName || 'Unnamed Team'}</h2>
            <p className="text-sm text-gray-500 mt-1">Status: {team.status || 'Pending'}</p>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-icon"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
          
          {/* Left Panel: Project & Team Details */}
          <div className="lg:w-2/5 bg-gray-50 p-6 lg:p-8 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-100 space-y-6">
            
            {/* Project Details */}
            <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-primary-500" /> Project Details
              </h3>
              <div className="flex flex-col gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1 font-medium">Assigned Track</p>
                  <p className="font-semibold text-gray-900">{getTrackName(team.assignedTrack)}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1 font-medium">Problem Statement</p>
                  <p className="font-semibold text-gray-900">{getProblemStatementName(team.assignedProblemStatement, true)}</p>
                </div>
              </div>
            </section>

            {/* Team Members */}
            <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User size={20} className="text-primary-500" /> Team Details
              </h3>
              
              <div className="mb-4 pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Team Leader</p>
                <p className="font-medium text-gray-900">{team.leaderEmail}</p>
              </div>
              
              {team.members && team.members.length > 0 ? (
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Members ({team.members.length})</p>
                  <div className="grid grid-cols-1 gap-3">
                    {team.members.map((m, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="font-bold text-gray-900">{m.name || 'Unnamed Member'}</p>
                        <p className="text-xs text-gray-500 truncate">{m.email || 'No email'}</p>
                        {m.organisation && <p className="text-xs text-gray-400 mt-1">{m.organisation}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No members found.</p>
              )}
            </section>
          </div>

          {/* Right Panel: Assessments */}
          <div className="lg:w-3/5 bg-white p-6 lg:p-8 lg:overflow-y-auto flex-1">
            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 px-1">
                <Star size={20} className="text-primary-500" /> Evaluator Assessments
              </h3>
              
              {!team.assessments || team.assessments.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-dashed border-gray-200 text-center text-gray-500 mt-4">
                  No evaluators have assessed this team yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {team.assessments.map((assessment, idx) => (
                    <div key={assessment._id || idx} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between gap-4 transition hover:border-primary-200">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-gray-900 text-base">{assessment.evaluatorName || 'Unknown Evaluator'}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">
                              {assessment.role === 'judge' ? 'Judge' : 'Session Chair'}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            {assessment.mode === 'absent' ? (
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 font-bold rounded-md text-xs">
                                <UserX size={14} /> Absent
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 font-bold rounded-md text-sm">
                                <CheckCircle size={16} /> {assessment.totalScore} <span className="text-[10px] font-semibold text-green-600/70 ml-0.5">pts</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {assessment.feedback && (
                          <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-700 italic flex items-start gap-2 border border-gray-100">
                            <MessageSquare size={16} className="text-gray-400 mt-0.5 shrink-0" />
                            <span>"{assessment.feedback}"</span>
                          </div>
                        )}

                        {assessment.criteria && assessment.criteria.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Criteria Breakdown</p>
                            <div className="flex flex-col gap-2">
                              {assessment.criteria.map((c, i) => {
                                // Support both old ikigai1 number array and new ikigai2 object array
                                const isObject = typeof c === 'object' && c !== null;
                                const name = isObject ? c.name : `Criteria ${i + 1}`;
                                const score = isObject ? c.score : c;
                                const inputType = isObject ? c.inputType : 'number';
                                const maxMarks = isObject ? c.maxMarks : '-';
                                
                                return (
                                  <div key={i} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                    <span className="text-sm text-gray-700 font-medium truncate pr-2" title={name}>{name}</span>
                                    <span className="text-sm font-bold text-gray-900 shrink-0">
                                      {inputType === 'boolean' ? (score ? 'Yes' : 'No') : score} 
                                      {inputType === 'number' && maxMarks !== '-' && <span className="text-xs text-gray-400 font-normal"> / {maxMarks}</span>}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
