import React from 'react';
import { Target, CheckCircle, Clock } from 'lucide-react';

export default function ProgressStats({ teams, currentEvaluatorId, currentEventId }) {
  if (!teams || teams.length === 0) return null;

  const total = teams.length;
  const evaluatedCount = teams.filter(t => {
    const eventObj = t.assessments?.find(a => a.eventId === currentEventId);
    return eventObj?.evaluatorScores?.some(s => s.evaluatorId === currentEvaluatorId);
  }).length;
  const pendingCount = total - evaluatedCount;
  
  const percentage = total > 0 ? Math.round((evaluatedCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <Target size={20} />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Total Teams</div>
          <div className="text-xl font-bold text-gray-900">{total}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
          <CheckCircle size={20} />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Evaluated</div>
          <div className="text-xl font-bold text-gray-900">{evaluatedCount} <span className="text-sm font-medium text-green-600">({percentage}%)</span></div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
          <Clock size={20} />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Pending</div>
          <div className="text-xl font-bold text-gray-900">{pendingCount}</div>
        </div>
      </div>
    </div>
  );
}
