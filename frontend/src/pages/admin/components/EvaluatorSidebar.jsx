import React from 'react';
import { User, ChevronRight, Lock, Unlock, Loader2 } from 'lucide-react';
import { authFetch } from '../../../config/api';

export default function EvaluatorSidebar({ evaluators, selectedEvaluatorId, onSelect, onRefresh }) {
  const [loadingId, setLoadingId] = React.useState(null);

  const toggleLock = async (evaluator, e) => {
    e.stopPropagation();
    if (loadingId) return;
    setLoadingId(evaluator._id);
    try {
      const res = await authFetch(`/admin/users/${evaluator._id}/lock`, { method: 'PATCH' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-2">
      {evaluators.length === 0 && <span className="text-sm text-gray-500">No evaluators found for this track.</span>}
      {evaluators.map(evaluator => (
        <div
          key={evaluator._id}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
            selectedEvaluatorId === evaluator._id
              ? 'bg-primary-50 border-primary-200 shadow-sm shadow-primary-500/10'
              : 'bg-white border-gray-100'
          }`}
        >
          <button 
            onClick={() => onSelect(evaluator._id)}
            className="flex flex-1 items-center gap-3 text-left overflow-hidden"
          >
            <div className={`p-2 rounded-full ${selectedEvaluatorId === evaluator._id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${selectedEvaluatorId === evaluator._id ? 'text-primary-800' : 'text-gray-700'}`}>
                {evaluator.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{evaluator.email}</p>
            </div>
          </button>
          
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <button
              onClick={(e) => toggleLock(evaluator, e)}
              disabled={loadingId === evaluator._id}
              className={`btn btn-icon btn-sm ${evaluator.isLocked ? 'hover:!bg-red-50 hover:!text-red-600 text-red-500' : 'hover:!bg-green-50 hover:!text-green-600 text-green-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
              title={evaluator.isLocked ? "Unlock Access" : "Lock Access"}
            >
              {loadingId === evaluator._id ? <Loader2 size={16} className="animate-spin text-gray-500" /> : (evaluator.isLocked ? <Lock size={16} /> : <Unlock size={16} />)}
            </button>
            <ChevronRight size={16} className={selectedEvaluatorId === evaluator._id ? 'text-primary-500' : 'text-gray-300'} />
          </div>
        </div>
      ))}
    </div>
  );
}
