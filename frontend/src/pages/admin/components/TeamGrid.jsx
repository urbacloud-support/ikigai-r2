import React from 'react';
import { Users as TeamIcon, CheckCircle, Clock, UserX } from 'lucide-react';

export default function TeamGrid({ teams, currentEvaluatorId }) {
  if (!teams || teams.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <TeamIcon size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500">No teams assigned to this track yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {teams.map(team => {
        const assessment = team.assessments?.find(a => a.evaluatorId === currentEvaluatorId);
        const isAssessed = !!assessment;
        const isAbsent = assessment?.mode === 'absent';

        return (
          <div key={team._id} className="p-5 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-900 text-lg line-clamp-1 flex-1 pr-2">
                  {team.teamName || 'Unnamed Team'}
                </h4>
                
                {isAssessed ? (
                  isAbsent ? (
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg whitespace-nowrap">
                      <UserX size={14} /> Absent
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg whitespace-nowrap">
                      <CheckCircle size={14} /> Done: {assessment.totalScore} pts
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg whitespace-nowrap">
                    <Clock size={14} /> Pending
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 font-medium mb-1">PS: {team.assignedProblemStatement || 'N/A'}</p>
              <p className="text-xs text-gray-500">Leader: {team.leaderEmail}</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-400">
              <TeamIcon size={14} />
              {team.members?.length || 0} Members
            </div>
          </div>
        );
      })}
    </div>
  );
}
