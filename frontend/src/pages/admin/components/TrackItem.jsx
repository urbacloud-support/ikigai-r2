import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import EvaluatorList from './EvaluatorList';

export default function TrackItem({ event, track, onRefresh }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all hover:border-primary-200">
      <div 
        className="flex justify-between items-start cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <h5 className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors">{track.title}</h5>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{track.description}</p>
        </div>
        <div className="ml-4 p-1.5 rounded-md bg-gray-50 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
          <ChevronDown size={18} className={`transition-transform duration-300 ${isExpanded ? '-rotate-180' : ''}`} />
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
          <EvaluatorList event={event} trackCode={track.code} onRefresh={onRefresh} />
        </div>
      )}
    </div>
  );
}
