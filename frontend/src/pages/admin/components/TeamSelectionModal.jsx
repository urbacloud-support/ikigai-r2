import React, { useState, useMemo } from 'react';
import { X, Search, CheckCircle } from 'lucide-react';
import { getTrackName, getProblemStatementName } from '../../../utils/mappingUtils';

export default function TeamSelectionModal({ isOpen, onClose, allTeams, selectedTeams, onSave }) {
  const [localSelected, setLocalSelected] = useState(new Set(selectedTeams));
  const [searchTerm, setSearchTerm] = useState('');

  // Group teams by track
  const groupedTeams = useMemo(() => {
    const groups = {};
    allTeams.forEach(team => {
      const trackName = getTrackName(team.assignedTrack);
      if (!groups[trackName]) groups[trackName] = [];
      groups[trackName].push(team);
    });
    return groups;
  }, [allTeams]);

  if (!isOpen) return null;

  const toggleTeam = (teamId) => {
    const next = new Set(localSelected);
    if (next.has(teamId)) {
      next.delete(teamId);
    } else {
      next.add(teamId);
    }
    setLocalSelected(next);
  };

  const toggleTrack = (teamsInTrack) => {
    const next = new Set(localSelected);
    const allSelected = teamsInTrack.every(t => next.has(t._id));
    if (allSelected) {
      teamsInTrack.forEach(t => next.delete(t._id));
    } else {
      teamsInTrack.forEach(t => next.add(t._id));
    }
    setLocalSelected(next);
  };

  const handleSave = () => {
    onSave(Array.from(localSelected));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Select Specific Teams</h3>
            <p className="text-sm text-gray-500 mt-1">Hand-pick top teams for this event. Selected: {localSelected.size}</p>
          </div>
          <button onClick={onClose} type="button" className="btn btn-icon">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search teams by name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-8 bg-gray-50/30">
          {Object.entries(groupedTeams).map(([trackName, teams]) => {
            const filteredTeams = teams.filter(t => t.teamName.toLowerCase().includes(searchTerm.toLowerCase()));
            if (filteredTeams.length === 0) return null;
            
            const allSelected = filteredTeams.every(t => localSelected.has(t._id));

            return (
              <div key={trackName} className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h4 className="font-bold text-gray-800">{trackName}</h4>
                  <button 
                    type="button" 
                    onClick={() => toggleTrack(filteredTeams)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-md"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {filteredTeams.map(team => {
                    const isSelected = localSelected.has(team._id);
                    return (
                      <div 
                        key={team._id} 
                        onClick={() => toggleTeam(team._id)}
                        className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-primary-50/50 border-primary-300 shadow-sm' 
                            : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-md'
                        }`}
                      >
                        <div>
                          <h5 className={`font-bold text-lg ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                            {team.teamName}
                          </h5>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {getProblemStatementName(team.assignedProblemStatement, true)}
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                          isSelected ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 text-transparent group-hover:border-primary-300'
                        }`}>
                          <CheckCircle size={16} strokeWidth={3} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {Object.keys(groupedTeams).length === 0 && (
            <div className="text-center text-gray-500 py-8">No teams available.</div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">
            {localSelected.size} team(s) selected
          </span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={handleSave} className="btn btn-primary">Save Selection</button>
          </div>
        </div>
      </div>
    </div>
  );
}
