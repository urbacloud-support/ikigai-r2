import React, { useState, useEffect } from 'react';
import { authFetch } from '../../config/api';
import Header from '../../components/shared/Header';
import { Loader2, Calendar, Trophy, ArrowLeft, Search, Play } from 'lucide-react';
import { io } from 'socket.io-client';

import LockBanner from './components/LockBanner';
import TrackCard from './components/TrackCard';
import AssessmentModal from './components/AssessmentModal';
import AssessmentSummary from './components/AssessmentSummary';
import { API_BASE } from '../../config/api';

export default function EvaluatorConsole() {
  const [session, setSession] = useState({ user: null, event: null });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const trackTeams = teams.filter(t => t.assignedTrack === selectedTrackId);
  const filteredTeams = trackTeams.filter(team => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchName = team.teamName?.toLowerCase().includes(query);
    const matchLeader = team.leaderEmail?.toLowerCase().includes(query);
    return matchName || matchLeader;
  });

  const fetchSessionData = async () => {
    try {
      const res = await authFetch('/evaluator/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await authFetch('/evaluator/teams');
      if (res.ok) {
        setTeams(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchSessionData();
      await fetchTeams();
      setLoading(false);
    };
    init();
  }, []);

  // Setup WebSocket for real-time lock updates
  useEffect(() => {
    if (!session.user?._id) return;

    const socket = io(API_BASE.replace('/api', '')); // Connect to root
    
    // Join evaluator room
    socket.emit('join-evaluator', session.user._id);

    socket.on('evaluator-lock-changed', (data) => {
      setSession(prev => ({
        ...prev,
        user: { ...prev.user, isLocked: data.isLocked }
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [session.user?._id]);

  const handleNextTeam = () => {
    if (selectedTeamIndex < filteredTeams.length - 1) {
      setSelectedTeamIndex(prev => prev + 1);
    }
  };

  const handlePrevTeam = () => {
    if (selectedTeamIndex > 0) {
      setSelectedTeamIndex(prev => prev - 1);
    }
  };

  const handleAssessmentSubmit = async (data) => {
    const currentTeam = filteredTeams[selectedTeamIndex];
    if (!currentTeam) return;
    try {
      const res = await authFetch(`/evaluator/teams/${currentTeam._id}/assess`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchTeams();
        if (selectedTeamIndex < filteredTeams.length - 1) {
          setSelectedTeamIndex(prev => prev + 1);
        } else {
          setIsModalOpen(false);
        }
        return null; // no error
      } else {
        const errData = await res.json();
        return errData.message || 'Failed to save assessment. Please try again.';
      }
    } catch (err) {
      console.error(err);
      return 'A network error occurred. Please try again.';
    }
  };

  const handleMarkAbsent = async () => {
    const currentTeam = filteredTeams[selectedTeamIndex];
    if (!currentTeam) return;
    try {
      const res = await authFetch(`/evaluator/teams/${currentTeam._id}/absent`, {
        method: 'PATCH'
      });
      if (res.ok) {
        await fetchTeams();
        if (selectedTeamIndex < filteredTeams.length - 1) {
          setSelectedTeamIndex(prev => prev + 1);
        } else {
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAssessment = (team) => {
    const idx = filteredTeams.findIndex(t => t._id === team._id);
    setSelectedTeamIndex(idx);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-primary-500 w-8 h-8" /></div>;
  }

  if (!session.user?.assignedTrackIds || session.user.assignedTrackIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto p-6 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Tracks Assigned</h2>
            <p className="text-gray-500">You have not been assigned to evaluate any specific track yet. Please wait or contact an administrator.</p>
          </div>
        </main>
      </div>
    );
  }

  const eventCriteria = session.event?.criteria || [];

  if (!selectedTrackId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-10">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LockBanner isLocked={session.user?.isLocked} />
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{session.event?.title || 'Event Dashboard'}</h1>
            <p className="text-gray-500 mt-2">Select an assigned track below to view and evaluate teams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {session.user.assignedTrackIds.map(trackId => {
              const trackObj = session.event?.selectedTracks?.find(t => t.code === trackId);
              const trackTeamsCount = teams.filter(t => t.assignedTrack === trackId).length;
              
              return (
                <div key={trackId} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full hover:border-primary-300 hover:shadow-md transition-all cursor-default">
                  <div className="flex-1 mb-6">
                    <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider rounded-lg mb-3">
                      Track {trackId}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{trackObj?.title || 'Unknown Track'}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{trackObj?.description || 'No description available.'}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5"><Calendar size={14}/> {trackTeamsCount} Teams</span>
                    <button 
                      onClick={() => setSelectedTrackId(trackId)}
                      className="btn btn-primary"
                    >
                      Open Track
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  const trackObj = session.event?.selectedTracks?.find(t => t.code === selectedTrackId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-10">
      <Header />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <LockBanner isLocked={session.user?.isLocked} />

        <div className="mb-4">
          <button 
            onClick={() => setSelectedTrackId(null)}
            className="btn btn-secondary w-fit flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Tracks
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.event?.title || 'Event'}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-sm font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                Track: {trackObj?.title || selectedTrackId}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <Calendar size={14} /> My Teams ({filteredTeams.length})
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Search teams..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            {filteredTeams.length > 0 && (
              <button 
                onClick={() => {
                  setSelectedTeamIndex(0);
                  setIsModalOpen(true);
                }}
                className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Play size={16} /> Start Assessment
              </button>
            )}
          </div>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800">No Teams Found</h3>
            <p className="text-gray-500 mt-1">There are no teams matching your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map(team => (
              <TrackCard 
                key={team._id} 
                team={team} 
                currentUserId={session.user._id} 
                currentEventId={session.event?._id}
                onClick={openAssessment}
              />
            ))}
          </div>
        )}

        {/* View Summary Floating Button */}
        {trackTeams.length > 0 && (
          <div className="fixed bottom-6 right-6 z-40">
            <button 
              onClick={() => setIsSummaryOpen(true)}
              className="btn btn-primary btn-lg shadow-xl shadow-primary-500/30 rounded-full px-6 py-3 font-semibold border-none"
            >
              <Trophy size={18} /> View Summary
            </button>
          </div>
        )}

      </main>

      <AssessmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        team={filteredTeams[selectedTeamIndex]}
        currentIndex={selectedTeamIndex}
        totalTeams={filteredTeams.length}
        onNext={handleNextTeam}
        onPrev={handlePrevTeam}
        eventCriteria={eventCriteria}
        currentUserId={session.user?._id}
        isJudge={session.user?.isJudge}
        currentEventId={session.event?._id}
        linkedPastEvents={session.event?.linkedPastEvents || []}
        isLocked={session.user?.isLocked}
        onSubmit={handleAssessmentSubmit}
        onMarkAbsent={handleMarkAbsent}
      />

      <AssessmentSummary 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        teams={trackTeams}
        criteria={eventCriteria}
        currentUserId={session.user?._id}
        currentEventId={session.event?._id}
      />
    </div>
  );
}
