import React, { useState, useEffect } from 'react';
import { authFetch } from '../../config/api';
import { Loader2, ChevronRight, User, Users as TeamIcon } from 'lucide-react';

export default function ProgressView() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState('');

  const [evaluators, setEvaluators] = useState([]);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState('');

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setSelectedTrackId(selectedEvent.selectedTracks[0].trackId);
      } else {
        setSelectedTrackId('');
      }
    } else {
      setTracks([]);
      setSelectedTrackId('');
    }
  }, [selectedEventId, events]);

  // 3. Fetch Evaluators (Normally filtered by event/track, here we just fetch all for demo)
  useEffect(() => {
    if (!selectedEventId || !selectedTrackId) return;
    fetchEvaluators();
  }, [selectedEventId, selectedTrackId]);

  const fetchEvaluators = async () => {
    try {
      const res = await authFetch('/admin/users');
      if (res.ok) {
        const data = await res.json();
        const evals = data.filter(u => u.role === 'evaluator' || u.role === 'judge');
        setEvaluators(evals);
        if (evals.length > 0) setSelectedEvaluatorId(evals[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Fetch Teams for selected evaluator
  useEffect(() => {
    if (!selectedEvaluatorId) return;
    // In actual implementation, we'd fetch teams assigned to this track/evaluator.
    // For now we just mock a subset to show the wireframe
    fetchTeams();
  }, [selectedEvaluatorId]);

  const fetchTeams = async () => {
    try {
      // Mocking fetch all teams to display
      // In production, we'd hit a route like `/admin/evaluators/${id}/progress`
      const res = await fetch('https://jsonplaceholder.typicode.com/users'); 
      if (res.ok) {
        setTeams([
          { _id: '1', name: 'Team Alpha', project: { title: 'AI Healthcare App', description: 'Detects diseases early.'} },
          { _id: '2', name: 'Team Beta', project: { title: 'Fintech Dashboard', description: 'Manages expenses.'} }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Event Picker Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Event</label>
        <select 
          className="w-full md:w-64 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2.5 outline-none"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
        >
          {events.map(ev => (
            <option key={ev._id} value={ev._id}>{ev.title}</option>
          ))}
        </select>
      </div>

      {/* Horizontal Track Picker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2">
        {tracks.length === 0 && <span className="p-2 text-sm text-gray-500">No tracks available for this event.</span>}
        {tracks.map(track => (
          <button
            key={track.trackId}
            onClick={() => setSelectedTrackId(track.trackId)}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selectedTrackId === track.trackId 
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {track.title}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Evaluator Sidebar (nested inside track) */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
          {evaluators.length === 0 && <span className="text-sm text-gray-500">No evaluators found.</span>}
          {evaluators.map(evaluator => (
            <button
              key={evaluator._id}
              onClick={() => setSelectedEvaluatorId(evaluator._id)}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                selectedEvaluatorId === evaluator._id
                  ? 'bg-primary-50 border-primary-200'
                  : 'bg-white border-gray-100 hover:border-primary-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${selectedEvaluatorId === evaluator._id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
                  <User size={16} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${selectedEvaluatorId === evaluator._id ? 'text-primary-800' : 'text-gray-700'}`}>
                    {evaluator.name}
                  </p>
                  <p className="text-xs text-gray-400">{evaluator.role}</p>
                </div>
              </div>
              <ChevronRight size={16} className={selectedEvaluatorId === evaluator._id ? 'text-primary-500' : 'text-gray-300'} />
            </button>
          ))}
        </div>

        {/* Evaluator Progress View */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
          {selectedEvaluatorId ? (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">
                Assigned Teams & Progress
              </h3>
              
              <div className="space-y-4">
                {teams.map(team => (
                  <div key={team._id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <TeamIcon size={16} className="text-primary-500" />
                        {team.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">{team.project?.title}</p>
                      <p className="text-xs text-gray-400 mt-1 max-w-lg">{team.project?.description}</p>
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 sm:gap-1 items-end">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-md">M1: Pending</span>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-md">M2: Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select an evaluator to view progress
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
