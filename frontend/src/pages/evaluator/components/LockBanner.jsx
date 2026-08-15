import React from 'react';
import { Lock } from 'lucide-react';

export default function LockBanner({ isLocked }) {
  if (!isLocked) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex items-start gap-3">
      <Lock className="text-red-500 mt-0.5" size={20} />
      <div>
        <h3 className="text-red-800 font-bold text-sm">Assessment Access Locked</h3>
        <p className="text-red-600 text-sm mt-1">
          Your ability to submit or edit assessments has been locked by the administrator. 
          You can still view teams, but you cannot make any changes.
        </p>
      </div>
    </div>
  );
}
