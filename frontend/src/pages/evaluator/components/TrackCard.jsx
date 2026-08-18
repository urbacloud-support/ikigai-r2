import React from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';
import { getProblemStatementName } from '../../../utils/mappingUtils';

export default function TrackCard({ team, currentUserId, onClick }) {
  const assessment = team.assessments?.find(a => a.evaluatorId === currentUserId);
  const isAssessed = !!assessment;

  return (
    <button
      onClick={() => onClick(team)}
      className="w-full text-left bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all group"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
            {team.teamName || 'Unnamed Team'}
          </h3>
          <div className="text-sm text-gray-500 mt-1">PS: {getProblemStatementName(team.assignedProblemStatement, true)}</div>
        </div>
        
        {isAssessed ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
            <CheckCircle size={14} /> Done
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
            <Clock size={14} /> Pending
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Users size={14} />
        {team.members?.length || 0} Members
      </div>
    </button>
  );
}
