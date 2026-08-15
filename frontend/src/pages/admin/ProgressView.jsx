import React, { useState, useEffect } from 'react';
import { authFetch } from '../../config/api';
import { Loader2, Download, Lock, Unlock } from 'lucide-react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../config/api';

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
        const trackEvals = allEvals.filter(e => e.assignedTrackId === selectedTrackId);
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
  useEffect(() => {
    if (!selectedEventId) return;
    
    const socket = io(API_BASE_URL.replace('/api', ''));
    socket.emit('join-event', selectedEventId);

    socket.on('assessment-saved', (data) => {
      // Re-fetch teams to get the latest assessment data
      // Optimization: we could update the local state manually, but a fetch is safer for consistency
      fetchData();
    });

    return () => socket.disconnect();
  }, [selectedEventId, selectedTrackId]); // Reconnect if event changes

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

  const exportCSV = () => {
    if (!teams.length) return;
    
    // Simplistic CSV export
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Team ID,Team Name,Problem Statement,Total Score\n";
    
    teams.forEach(t => {
      // Find assessment for selected evaluator
      const a = t.assessments?.find(ass => ass.evaluatorId === selectedEvaluatorId);
      const score = a ? a.totalScore : 'Pending';
      csvContent += `${t._id},"${t.teamName || 'Unnamed'}","${t.assignedProblemStatement || ''}",${score}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `track_${selectedTrackId}_progress.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="w-full md:w-auto">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Event</label>
          <select 
            className="w-full md:w-64 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2.5 outline-none font-medium"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map(ev => (
              <option key={ev._id} value={ev._id}>{ev.title}</option>
            ))}
          </select>
        </div>

        {selectedEventId && (
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => handleLockAll(true)} disabled={lockingAll}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Lock size={16} /> Lock All
            </button>
            <button 
              onClick={() => handleLockAll(false)} disabled={lockingAll}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Unlock size={16} /> Unlock All
            </button>
            <button 
              onClick={exportCSV}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-sm font-semibold transition-colors"
            >
              <Download size={16} /> Export
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 overflow-x-auto whitespace-nowrap flex gap-2">
        {tracks.length === 0 && <span className="p-2 text-sm text-gray-500">No tracks available for this event.</span>}
        {tracks.map(track => (
          <button
            key={track.code}
            onClick={() => setSelectedTrackId(track.code)}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selectedTrackId === track.code 
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
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
              
              <ProgressStats teams={teams} currentEvaluatorId={selectedEvaluatorId} />
              
              <div className="bg-gray-50/50 rounded-2xl p-1">
                <TeamGrid teams={teams} currentEvaluatorId={selectedEvaluatorId} />
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
