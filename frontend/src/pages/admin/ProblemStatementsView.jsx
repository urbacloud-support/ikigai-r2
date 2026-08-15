import React, { useState, useEffect } from 'react';
import { authFetch } from '../../config/api';
import { Loader2, FolderKanban, Users } from 'lucide-react';

export default function ProblemStatementsView() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await authFetch('/admin/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group teams by track, then by problem statement
  const groupedData = teams.reduce((acc, team) => {
    const track = team.assignedTrack || 'Unassigned Track';
    const ps = team.assignedProblemStatement || 'Unassigned PS';
    
    if (!acc[track]) acc[track] = {};
    if (!acc[track][ps]) acc[track][ps] = [];
    
    acc[track][ps].push(team);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Problem Statements & Teams</h2>

      {Object.keys(groupedData).length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
          No teams found in the system.
        </div>
      ) : (
        Object.entries(groupedData).sort().map(([track, psGroups]) => (
          <div key={track} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex items-center gap-2">
              <FolderKanban className="text-primary-600" size={20} />
              <h3 className="font-bold text-lg text-primary-900">
                Track: {track === 'Unassigned Track' ? 'No Track Assigned' : track}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {Object.entries(psGroups).sort().map(([ps, psTeams]) => (
                <div key={ps} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-100/50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="font-semibold text-gray-800">
                      PS: {ps === 'Unassigned PS' ? 'No Problem Statement Assigned' : ps}
                    </h4>
                    <span className="flex items-center gap-1.5 text-xs font-medium bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-600">
                      <Users size={14} /> {psTeams.length} {psTeams.length === 1 ? 'Team' : 'Teams'}
                    </span>
                  </div>
                  
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {psTeams.map(team => (
                      <div key={team._id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{team.teamName || 'Unnamed Team'}</div>
                          <div className="text-xs text-gray-500 mt-1">Leader: {team.leaderEmail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
