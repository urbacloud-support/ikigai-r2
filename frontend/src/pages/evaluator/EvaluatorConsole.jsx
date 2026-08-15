import React, { useState, useEffect } from 'react';
import { authFetch } from '../../config/api';
import Header from '../../components/shared/Header';
import { Loader2, Calendar } from 'lucide-react';
import { io } from 'socket.io-client';

import LockBanner from './components/LockBanner';
import TrackCard from './components/TrackCard';
import AssessmentModal from './components/AssessmentModal';
import { API_BASE } from '../../config/api';

export default function EvaluatorConsole() {
  const [session, setSession] = useState({ user: null, event: null });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleAssessmentSubmit = async (data) => {
    try {
      const res = await authFetch(`/evaluator/teams/${selectedTeam._id}/assess`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchTeams();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAbsent = async () => {
    try {
      const res = await authFetch(`/evaluator/teams/${selectedTeam._id}/absent`, {
        method: 'PATCH'
      });
      if (res.ok) {
        await fetchTeams();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAssessment = (team) => {
    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-primary-500 w-8 h-8" /></div>;
  }

  if (!session.user?.assignedTrackId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto p-6 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Track Assigned</h2>
            <p className="text-gray-500">You have not been assigned to evaluate any specific track yet. Please wait or contact an administrator.</p>
          </div>
        </main>
      </div>
    );
  }

  const trackObj = session.event?.selectedTracks?.find(t => t.code === session.user.assignedTrackId);
  const eventCriteria = session.event?.criteria || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-10">
      <Header />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <LockBanner isLocked={session.user?.isLocked} />

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.event?.title || 'Event'}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-sm font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                Track: {trackObj?.title || session.user.assignedTrackId}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <Calendar size={14} /> My Teams ({teams.length})
              </span>
            </div>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800">No Teams Available</h3>
            <p className="text-gray-500 mt-1">There are no teams assigned to your track yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => (
              <TrackCard 
                key={team._id} 
                team={team} 
                currentUserId={session.user._id} 
                onClick={openAssessment}
              />
            ))}
          </div>
        )}

      </main>

      <AssessmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        team={selectedTeam}
        eventCriteria={eventCriteria}
        currentUserId={session.user?._id}
        isLocked={session.user?.isLocked}
        onSubmit={handleAssessmentSubmit}
        onMarkAbsent={handleMarkAbsent}
      />
    </div>
  );
}
