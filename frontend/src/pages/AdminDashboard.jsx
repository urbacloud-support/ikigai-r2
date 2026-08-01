import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiUsers, FiLayers, FiCalendar } from 'react-icons/fi';

export default function AdminDashboard() {
  const location = useLocation();
  const path = location.pathname;
  
  const [tracks, setTracks] = useState([]);
  const [newTrack, setNewTrack] = useState({ title: '', description: '' });
  
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState({ teamName: '', leaderName: '', leaderEmail: '', leaderPassword: '' });
  
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '' });

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (path === '/admin') {
      fetchTracks();
    } else if (path === '/admin/teams') {
      fetchTeams();
    } else if (path === '/admin/events') {
      fetchEvents();
    }
  }, [path]);

  const fetchTracks = async () => {
    try {
      const res = await axios.get('/api/admin/tracks');
      if (res.data.success) {
        setTracks(res.data.tracks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await axios.get('/api/admin/teams');
      if (res.data.success) {
        setTeams(res.data.teams);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/admin/events');
      if (res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTrack = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/tracks', newTrack);
      if (res.data.success) {
        setMessage('Track created successfully!');
        setNewTrack({ title: '', description: '' });
        fetchTracks();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating track');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/teams', newTeam);
      if (res.data.success) {
        setMessage('Team created successfully!');
        setNewTeam({ teamName: '', leaderName: '', leaderEmail: '', leaderPassword: '' });
        fetchTeams();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating team');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/events', newEvent);
      if (res.data.success) {
        setMessage('Event created successfully!');
        setNewEvent({ title: '', description: '', date: '' });
        fetchEvents();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating event');
    }
  };

  return (
    <div className="w-full">
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-white/80 border border-green-200 text-green-800 font-medium">
          {message}
        </div>
      )}

      {/* Content */}
      <div className="glass-panel p-6 rounded-3xl">
        {path === '/admin' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2"><FiPlus /> Create Track</h2>
              <form onSubmit={handleCreateTrack} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Track Title" 
                  required
                  value={newTrack.title}
                  onChange={(e) => setNewTrack({...newTrack, title: e.target.value})}
                  className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                />
                <textarea 
                  placeholder="Track Description" 
                  required
                  rows="3"
                  value={newTrack.description}
                  onChange={(e) => setNewTrack({...newTrack, description: e.target.value})}
                  className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                ></textarea>
                <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-md">
                  Add Track
                </button>
              </form>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-green-800 mb-4">Existing Tracks</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {tracks.length === 0 ? <p className="text-slate-500 text-sm">No tracks found.</p> : null}
                {tracks.map(track => (
                  <div key={track._id} className="p-4 rounded-xl bg-white/70 border border-white/50 shadow-sm">
                    <h3 className="font-bold text-slate-800">{track.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{track.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {path === '/admin/teams' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-green-800 mb-6 flex items-center gap-2"><FiUsers /> Create New Team</h2>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Team Name" 
                  required
                  value={newTeam.teamName}
                  onChange={(e) => setNewTeam({...newTeam, teamName: e.target.value})}
                  className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Leader Name" 
                    required
                    value={newTeam.leaderName}
                    onChange={(e) => setNewTeam({...newTeam, leaderName: e.target.value})}
                    className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                  />
                  <input 
                    type="email" 
                    placeholder="Leader Email" 
                    required
                    value={newTeam.leaderEmail}
                    onChange={(e) => setNewTeam({...newTeam, leaderEmail: e.target.value})}
                    className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Leader Password" 
                  required
                  value={newTeam.leaderPassword}
                  onChange={(e) => setNewTeam({...newTeam, leaderPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                />
                <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-md mt-2">
                  Create Team & Leader Account
                </button>
              </form>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-green-800 mb-4">Existing Teams</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {teams.length === 0 ? <p className="text-slate-500 text-sm">No teams found.</p> : null}
                {teams.map(team => (
                  <div key={team._id} className="p-4 rounded-xl bg-white/70 border border-white/50 shadow-sm flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">{team.teamName}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${team.isRegistered ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {team.isRegistered ? 'Registered' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">Leader: {team.leader?.name} ({team.leader?.email})</p>
                    <p className="text-xs text-slate-500">{team.members?.length} Members</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {path === '/admin/events' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-green-800 mb-6 flex items-center gap-2"><FiCalendar /> Create New Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Event Title" 
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                />
                <input 
                  type="date" 
                  required
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                />
                <textarea 
                  placeholder="Event Description" 
                  required
                  rows="3"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                ></textarea>
                <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-md">
                  Create Event
                </button>
              </form>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-green-800 mb-4">Existing Events</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {events.length === 0 ? <p className="text-slate-500 text-sm">No events found.</p> : null}
                {events.map(ev => (
                  <div key={ev._id} className="p-4 rounded-xl bg-white/70 border border-white/50 shadow-sm">
                    <h3 className="font-bold text-slate-800">{ev.title}</h3>
                    <p className="text-xs font-semibold text-green-600 mb-1">{ev.date}</p>
                    <p className="text-sm text-slate-600">{ev.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
