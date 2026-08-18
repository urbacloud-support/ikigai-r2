import React, { useState, useEffect } from 'react';
import { authFetch } from '../../config/api';
import { Loader2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { getTrackName, getProblemStatementName, getProblemStatementLimit } from '../../utils/mappingUtils';

export default function ProblemStatementsView() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTrack, setExpandedTrack] = useState(null);
  const [expandedStatement, setExpandedStatement] = useState(null);

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

  const toggleTrack = (trackName) => {
    setExpandedTrack(expandedTrack === trackName ? null : trackName);
  };

  const toggleStatement = (psName) => {
    setExpandedStatement(expandedStatement === psName ? null : psName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 flex-1 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <BookOpen className="text-primary-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">Problem Statements</h2>
        </div>

        {Object.keys(groupedData).length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
            No teams found in the system.
          </div>
        ) : (
          <div className="space-y-4 pb-12">
            {Object.entries(groupedData).sort().map(([track, psGroups]) => {
              const isExpanded = expandedTrack === track;
              // Calculate track capacity (number of teams)
              let trackTeamsCount = 0;
              Object.values(psGroups).forEach(teamsArr => trackTeamsCount += teamsArr.length);

              return (
                <div key={track} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
                  {/* Track Header */}
                  <div 
                    onClick={() => toggleTrack(track)}
                    className={`p-4 md:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition ${isExpanded ? 'bg-primary-50/30' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-md">
                          Track
                        </span>
                        <h3 className="text-lg font-bold text-gray-800">{getTrackName(track)}</h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-gray-500 font-semibold uppercase">Assigned</p>
                        <p className="text-lg font-bold text-gray-800">{trackTeamsCount} Teams</p>
                      </div>
                      <div className="text-gray-400">
                        <ChevronDown size={24} className={`transition-transform duration-300 ${isExpanded ? '-rotate-180 text-primary-500' : 'text-gray-400'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expandable Content */}
                  {isExpanded && (
                    <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                      <div className="space-y-3 mb-6">
                        {Object.entries(psGroups).sort().map(([ps, psTeams]) => {
                          const isStmtExpanded = expandedStatement === ps;
                          const psLimit = getProblemStatementLimit(ps);

                          return (
                            <div key={ps} className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                              <div 
                                className={`flex flex-col md:flex-row gap-3 items-start md:items-center p-3 cursor-pointer hover:bg-gray-50 transition ${isStmtExpanded ? 'bg-gray-50' : ''}`}
                                onClick={() => toggleStatement(ps)}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="bg-gray-100 text-gray-700 font-bold px-2.5 py-1.5 rounded-md min-w-[70px] text-center shrink-0">
                                    {ps}
                                    <span className="text-[10px] block font-normal">{psTeams.length}/{psLimit} Teams</span>
                                  </span>
                                </div>
                                
                                <div className="flex-1 px-2 text-gray-800 font-medium text-sm">
                                  {getProblemStatementName(ps)}
                                </div>
                                
                                <div className="flex items-center gap-3 w-full md:w-auto justify-end text-gray-400 pr-2 md:pr-4">
                                  <ChevronDown size={20} className={`transition-transform duration-300 ${isStmtExpanded ? '-rotate-180 text-primary-500' : 'text-gray-400'}`} />
                                </div>
                              </div>
                              
                              {/* Assigned Teams Expandable Section */}
                              {isStmtExpanded && (
                                <div className="bg-gray-50 border-t border-gray-100 p-4">
                                  <h4 className="text-sm font-bold text-gray-700 mb-3">Teams Assigned ({psTeams.length}):</h4>
                                  {psTeams.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                      {psTeams.map(t => (
                                        <div key={t._id} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                                            {(t.teamName || 'U').charAt(0).toUpperCase()}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{t.teamName || 'Unnamed Team'}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{t.leaderEmail}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500 italic">No teams have selected this problem statement yet.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
