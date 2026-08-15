import React from 'react';
import { X, Trophy } from 'lucide-react';

export default function AssessmentSummary({ isOpen, onClose, teams, criteria, currentUserId }) {
  if (!isOpen) return null;

  // Filter out teams that haven't been assessed by THIS evaluator
  const assessedTeams = teams.filter(t => 
    t.assessments && t.assessments.some(a => a.evaluatorId === currentUserId)
  );

  // Map to a more usable format for sorting and rendering
  const mappedTeams = assessedTeams.map(team => {
    const assessment = team.assessments.find(a => a.evaluatorId === currentUserId);
    return {
      _id: team._id,
      teamName: team.teamName || 'Unnamed',
      psId: team.assignedProblemStatement || 'N/A',
      assessment: assessment
    };
  });

  // Sort by total score descending
  mappedTeams.sort((a, b) => (b.assessment?.totalScore || 0) - (a.assessment?.totalScore || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Assessment Summary</h2>
              <p className="text-sm text-gray-500">You have assessed {mappedTeams.length} out of {teams.length} teams.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-icon"
            title="Close Summary"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
          {mappedTeams.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl border border-gray-200 border-dashed">
              <p className="text-gray-500">You haven't submitted any assessments yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-600 uppercase bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Rank</th>
                    <th className="px-4 py-3 font-semibold">Team Details</th>
                    {criteria.map((c, i) => (
                      <th key={i} className="px-4 py-3 font-semibold text-center whitespace-nowrap">
                        {c.name} ({c.maxMarks})
                      </th>
                    ))}
                    <th className="px-4 py-3 font-semibold text-center text-primary-700 bg-primary-50/50">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mappedTeams.map((team, index) => {
                    const isAbsent = team.assessment.mode === 'absent';
                    const cScores = team.assessment.criteria || [];
                    
                    return (
                      <tr key={team._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-500">
                          #{index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{team.teamName}</div>
                          <div className="text-xs text-gray-500 mt-0.5 font-mono">{team.psId}</div>
                        </td>
                        
                        {isAbsent ? (
                          <td colSpan={criteria.length + 1} className="px-4 py-3 text-center text-red-500 font-medium bg-red-50/30">
                            Marked Absent
                          </td>
                        ) : (
                          <>
                            {criteria.map((c, i) => {
                              const val = cScores[i]?.score ?? cScores[i];
                              const displayVal = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : (val ?? '-');
                              return (
                                <td key={i} className="px-4 py-3 text-center text-gray-700 font-medium">
                                  {displayVal}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center font-bold text-primary-700 bg-primary-50/30">
                              {team.assessment.totalScore}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
