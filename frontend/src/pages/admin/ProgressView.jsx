import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '../../config/api';
import { Loader2, Download, Lock, Unlock, Calendar, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { io } from 'socket.io-client';
import { API_BASE } from '../../config/api';
import { getProblemStatementName } from '../../utils/mappingUtils';
import EvaluatorSidebar from './components/EvaluatorSidebar';
import ProgressStats from './components/ProgressStats';
import TeamGrid from './components/TeamGrid';

export default function ProgressView() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(''); // This is track code

  const [evaluators, setEvaluators] = useState([]);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState('');

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lockingAll, setLockingAll] = useState(false);

  // 1. Fetch Events
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await authFetch('/admin/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0) setSelectedEventId(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Derive Tracks based on selected event
  useEffect(() => {
    const selectedEvent = events.find(e => e._id === selectedEventId);
    if (selectedEvent && selectedEvent.selectedTracks) {
      setTracks(selectedEvent.selectedTracks);
      if (selectedEvent.selectedTracks.length > 0) {
        setSelectedTrackId(selectedEvent.selectedTracks[0].code);
      } else {
        setSelectedTrackId('');
      }
    } else {
      setTracks([]);
      setSelectedTrackId('');
    }
  }, [selectedEventId, events]);

  // 3. Fetch Evaluators and Teams based on Track
  useEffect(() => {
    if (!selectedEventId || !selectedTrackId) return;
    fetchData();
  }, [selectedEventId, selectedTrackId]);

  const fetchData = async () => {
    try {
      // Get evaluators for this event
      const evRes = await authFetch(`/admin/events/${selectedEventId}/evaluators`);
      if (evRes.ok) {
        const allEvals = await evRes.json();
        // Filter by trackCode client side
        const trackEvals = allEvals.filter(e => e.assignedTrackIds && e.assignedTrackIds.includes(selectedTrackId));
        setEvaluators(trackEvals);
        if (trackEvals.length > 0 && !trackEvals.find(e => e._id === selectedEvaluatorId)) {
          setSelectedEvaluatorId(trackEvals[0]._id);
        } else if (trackEvals.length === 0) {
          setSelectedEvaluatorId('');
        }
      }

      // Get teams for this track
      const teamRes = await authFetch(`/admin/teams?trackCode=${selectedTrackId}`);
      if (teamRes.ok) {
        setTeams(await teamRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. WebSocket setup for real-time progress
  const latestFetchData = useRef(fetchData);
  useEffect(() => {
    latestFetchData.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    if (!selectedEventId) return;
    
    const socket = io(API_BASE.replace('/api', ''));
    socket.emit('join-event', selectedEventId);

    socket.on('assessment-saved', (data) => {
      // Use the ref to ensure we call the latest fetchData without recreating the socket
      if (latestFetchData.current) {
        latestFetchData.current();
      }
    });

    return () => socket.disconnect();
  }, [selectedEventId]); // Only reconnect if the event itself changes

  const handleLockAll = async (lockState) => {
    if (!window.confirm(`Are you sure you want to ${lockState ? 'lock' : 'unlock'} ALL evaluators for this event?`)) return;
    setLockingAll(true);
    try {
      await authFetch(`/admin/events/${selectedEventId}/lock-all`, {
        method: 'PATCH',
        body: JSON.stringify({ locked: lockState })
      });
      fetchData(); // Refresh to get updated lock states
    } catch (err) {
      console.error(err);
    } finally {
      setLockingAll(false);
    }
  };

  // Export functionality removed per user request
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
        <div className="w-full lg:w-auto flex-1 max-w-md">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Current Event</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-primary-500 group-hover:text-primary-600 transition-colors" />
            </div>
            <select 
              className="block w-full pl-12 pr-10 py-3.5 bg-gray-50 border-2 border-transparent hover:border-gray-200 text-gray-900 text-base font-bold rounded-xl focus:bg-white focus:ring-0 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all shadow-sm"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.map(ev => (
                <option key={ev._id} value={ev._id}>{ev.title}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
              <ChevronDownIcon size={20} />
            </div>
          </div>
        </div>

        {selectedEventId && (
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <button 
              onClick={() => handleLockAll(true)} disabled={lockingAll}
              className="btn btn-danger flex-1 sm:flex-none py-2.5 px-5 font-semibold shadow-sm"
            >
              <Lock size={18} /> Lock All
            </button>
            <button 
              onClick={() => handleLockAll(false)} disabled={lockingAll}
              className="btn btn-success flex-1 sm:flex-none py-2.5 px-5 font-semibold shadow-sm"
            >
              <Unlock size={18} /> Unlock All
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 overflow-x-auto flex gap-4 justify-between items-center min-h-[90px]">
        {tracks.length === 0 && <span className="p-2 text-sm text-gray-500 w-full text-center">No tracks available for this event.</span>}
        {tracks.map(track => (
          <button
            key={track.code}
            onClick={() => setSelectedTrackId(track.code)}
            className={`btn flex-1 min-w-[150px] justify-center py-3 text-sm md:text-base font-bold transition-all ${selectedTrackId === track.code ? 'btn-primary shadow-md transform scale-[1.02]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
          >
            {track.title}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        <EvaluatorSidebar 
          evaluators={evaluators}
          selectedEvaluatorId={selectedEvaluatorId}
          onSelect={setSelectedEvaluatorId}
          onRefresh={fetchData}
        />

        <div className="flex-1 min-w-0">
          {selectedEvaluatorId ? (
            <div className="animate-in fade-in duration-300">
              
              <ProgressStats teams={teams} currentEvaluatorId={selectedEvaluatorId} currentEventId={selectedEventId} />
              
              <div className="bg-gray-50/50 rounded-2xl p-1">
                <TeamGrid teams={teams} currentEvaluatorId={selectedEvaluatorId} currentEventId={selectedEventId} />
              </div>

            </div>
          ) : (
            <div className="h-full min-h-[300px] flex items-center justify-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
              {evaluators.length > 0 ? 'Select an evaluator from the sidebar' : 'No evaluators assigned to this track'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
